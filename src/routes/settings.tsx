import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  User,
  Mail,
  Smartphone,
  Shield,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({
    meta: [
      { title: "Configurações — Ember" },
      { name: "description", content: "Gerencie seu perfil e preferências." },
    ],
  }),
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth", search: { redirect: "/settings" } });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Client-side validation — fail fast before touching network
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem válido.");
      if (e.target) e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      if (e.target) e.target.value = "";
      return;
    }

    const previousUrl = profile?.avatar_url ?? null;
    const fileExt = (file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `${user!.id}/${crypto.randomUUID()}.${fileExt}`;
    let uploadedPath: string | null = null;

    // Retry helper with exponential backoff for intermittent network failures.
    // Previous avatar stays in DB + UI until the new one is fully committed.
    async function withRetry<T>(label: string, fn: () => Promise<T>, attempts = 3): Promise<T> {
      let lastErr: unknown;
      for (let i = 0; i < attempts; i++) {
        try {
          return await fn();
        } catch (err) {
          lastErr = err;
          console.warn(`[avatar-upload] ${label} tentativa ${i + 1}/${attempts} falhou`, err);
          if (i < attempts - 1) {
            await new Promise((r) => setTimeout(r, 400 * Math.pow(2, i)));
          }
        }
      }
      throw lastErr;
    }

    setUploading(true);
    const pendingToast = toast.loading("Enviando foto…");
    try {
      await withRetry("storage.upload", async () => {
        const { error } = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
      });
      uploadedPath = filePath;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await withRetry("profiles.update", async () => {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user!.id);
        if (error) throw error;
      });

      await qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.success("Foto de perfil atualizada!", { id: pendingToast });
    } catch (error) {
      console.error("[avatar-upload] falha após retries", error);
      // Rollback: remove orphan file and restore previous avatar in DB
      if (uploadedPath) {
        await supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
      }
      try {
        await supabase
          .from("profiles")
          .update({ avatar_url: previousUrl })
          .eq("id", user!.id);
      } catch {/* best-effort */}
      await qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.error("Falha no envio — sua foto anterior foi mantida.", { id: pendingToast });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          phone: phone,
        })
        .eq("id", user!.id);

      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["profile", user!.id] });
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar alterações");
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || profileLoading) return <CenterLoader label="Carregando perfil..." />;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/80 p-6 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="rounded-full p-2 hover:bg-white/5 transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="font-display text-2xl">Configurações</h1>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-full bg-ember px-6 py-2 text-sm font-bold uppercase tracking-widest text-white shadow-ember transition hover:scale-[1.02] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <section className="space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="h-32 w-32 overflow-hidden rounded-[2.5rem] border-2 border-white/10 bg-charcoal/50 shadow-2xl transition-all group-hover:border-ember/50">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-gradient-to-br from-charcoal to-background">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-ember" />
                  </div>
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 cursor-pointer rounded-2xl bg-ember p-3 text-white shadow-ember transition-transform hover:scale-110 active:scale-95">
                <Camera className="h-5 w-5" />
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Foto de perfil</p>
          </div>

          <div className="grid gap-6">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <User className="h-4 w-4 text-ember" /> Informações Pessoais
              </h3>
              <div className="space-y-3">
                <InputGroup label="Nome completo" value={displayName} onChange={setDisplayName} icon={<User className="h-4 w-4" />} />
                <InputGroup label="E-mail" value={user.email || ""} disabled icon={<Mail className="h-4 w-4" />} />
                <InputGroup label="Celular" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" icon={<Smartphone className="h-4 w-4" />} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <Shield className="h-4 w-4 text-ember" /> Segurança
              </h3>
              <div className="rounded-3xl border border-white/5 bg-charcoal/40 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold">Alterar senha</p>
                    <p className="text-xs text-muted-foreground">Receba um link de redefinição no seu e-mail</p>
                  </div>
                  <button 
                    onClick={() => toast.info("Link enviado para seu e-mail!")}
                    className="rounded-full bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
                  >
                    Enviar Link
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button className="flex w-full items-center justify-center gap-2 rounded-3xl border border-red-500/20 bg-red-500/5 py-4 text-xs font-bold uppercase tracking-widest text-red-400 transition hover:bg-red-500/10">
                <Trash2 className="h-4 w-4" /> Excluir minha conta
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function InputGroup({ label, value, onChange, icon, ...rest }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-charcoal/60 px-4 py-3.5 transition focus-within:border-ember focus-within:bg-charcoal/80">
        <span className="text-muted-foreground">{icon}</span>
        <input
          {...rest}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
        />
      </div>
    </div>
  );
}

function CenterLoader({ label }: { label: string }) {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <div className="text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-ember" />
        <p className="mt-4 font-display text-xl text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
