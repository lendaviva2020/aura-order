import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Flame, QrCode, ShoppingBag, Sparkles, Timer, Utensils, LogIn, User } from "lucide-react";
import heroBurger from "@/assets/hero-burger.jpg";
import productDouble from "@/assets/product-double.jpg";
import productFries from "@/assets/product-fries.jpg";
import productShake from "@/assets/product-shake.jpg";

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <Nav />
      <Hero />
      <Marquee />
      <HowItWorks />
      <Showcase />
      <Stats />
      <Loyalty />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-ember shadow-ember">
            <Flame className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl tracking-wider">EMBER</span>
        </Link>
        <nav className="hidden gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="hover:text-foreground transition">Como funciona</a>
          <a href="#menu" className="hover:text-foreground transition">Cardápio</a>
          <a href="#loyalty" className="hover:text-foreground transition">Recompensas</a>
          <a href="#contact" className="hover:text-foreground transition">Contato</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-charcoal/60 px-3 py-2 text-xs font-semibold text-foreground backdrop-blur transition hover:bg-charcoal sm:px-4 sm:text-sm"
          >
            <LogIn className="h-4 w-4" /> Entrar
          </Link>
          <Link
            to="/menu"
            search={{ table: "12" }}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:scale-[1.03] shadow-ember sm:px-5 sm:py-2.5 sm:text-sm"
          >
            Testar demo
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="absolute inset-0 bg-ember-radial opacity-70" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.6) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2 md:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-charcoal/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-ember" />
            Plataforma de pedidos autônoma
          </div>
          <h1 className="mt-6 font-display text-5xl leading-[0.95] sm:text-6xl md:text-7xl lg:text-8xl">
            ESCANEIE.<br />
            PEÇA.<br />
            <span className="text-gradient-ember">COMA NA HORA.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            Um QR Code por mesa. O cliente pede e paga pelo celular — sua equipe só
            cozinha e entrega. Zero filas, zero atrito.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/menu"
              search={{ table: "12" }}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-ember transition hover:scale-[1.03]"
            >
              <QrCode className="h-5 w-5" />
              Começar pedido
            </Link>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-charcoal/40 px-7 py-3.5 text-base font-semibold text-foreground backdrop-blur transition hover:bg-charcoal"
            >
              Ver como funciona
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-xs text-muted-foreground">
            <Stat label="Tempo médio" value="42s" />
            <div className="h-8 w-px bg-border" />
            <Stat label="Giro de mesas" value="+38%" />
            <div className="h-8 w-px bg-border" />
            <Stat label="Economia" value="2,4x" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-10 rounded-full bg-ember/30 blur-3xl animate-ember-pulse" />
          <img
            src={heroBurger}
            alt="Hambúrguer Ember Classic"
            width={1536}
            height={1536}
            className="relative w-full rounded-3xl object-cover shadow-soft"
          />
          <FloatingCard className="absolute -left-4 top-12 hidden md:flex" delay={0.6}>
            <Timer className="h-5 w-5 text-ember" />
            <div>
              <div className="text-xs text-muted-foreground">Pronto em</div>
              <div className="font-semibold">8 minutos</div>
            </div>
          </FloatingCard>
          <FloatingCard className="absolute -right-4 bottom-12 hidden md:flex" delay={0.9}>
            <ShoppingBag className="h-5 w-5 text-ember" />
            <div>
              <div className="text-xs text-muted-foreground">Mesa 12 · Pedido</div>
              <div className="font-semibold">Pago · R$ 124,40</div>
            </div>
          </FloatingCard>
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-display text-2xl text-foreground">{value}</div>
      <div className="uppercase tracking-widest">{label}</div>
    </div>
  );
}

function FloatingCard({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className={`flex items-center gap-3 rounded-2xl border border-border bg-charcoal/80 px-4 py-3 backdrop-blur-xl shadow-soft animate-float ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

function Marquee() {
  const items = ["HAMBURGUERIAS", "LANCHONETES", "CAFETERIAS", "PUBS", "FAST FOOD", "FOOD TRUCKS"];
  return (
    <div className="border-y border-border bg-charcoal/30 py-6">
      <div className="flex animate-[marquee_30s_linear_infinite] gap-12 whitespace-nowrap">
        {[...items, ...items, ...items].map((t, i) => (
          <span key={i} className="font-display text-2xl tracking-[0.3em] text-muted-foreground/60">
            {t} <span className="mx-6 text-ember">◆</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee {0%{transform:translateX(0)}100%{transform:translateX(-33.333%)}}`}</style>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { icon: QrCode, title: "Escaneie o QR", body: "O cliente lê o QR Code da mesa — a sessão abre na hora, sem instalar app." },
    { icon: Utensils, title: "Monte o pedido", body: "Cardápio digital, customizações e observações — tudo do celular." },
    { icon: Flame, title: "Cozinhe e entregue", body: "Sua cozinha vê o pedido em tempo real e entrega direto na mesa certa." },
  ];
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="mb-16 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-ember">Fluxo</p>
        <h2 className="mt-3 font-display text-5xl md:text-6xl">Três passos. Zero fila.</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-border bg-charcoal/50 p-8"
          >
            <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-ember/10 blur-2xl transition group-hover:bg-ember/20" />
            <div className="relative">
              <div className="mb-6 inline-grid h-14 w-14 place-items-center rounded-2xl bg-ember/10 text-ember">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="font-display text-7xl text-muted-foreground/30">0{i + 1}</div>
              <h3 className="mt-2 font-display text-3xl">{s.title}</h3>
              <p className="mt-3 text-muted-foreground">{s.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Showcase() {
  const items = [
    { img: productDouble, name: "Double Stack", price: "R$ 39,90" },
    { img: heroBurger, name: "Ember Classic", price: "R$ 32,50" },
    { img: productFries, name: "Fritas Ember", price: "R$ 18,50" },
    { img: productShake, name: "Inferno Shake", price: "R$ 22,90" },
  ];
  return (
    <section id="menu" className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ember">O Cardápio</p>
          <h2 className="mt-3 font-display text-5xl md:text-6xl">Feito à mão. No fogo.</h2>
        </div>
        <Link
          to="/menu"
          search={{ table: "12" }}
          className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:bg-charcoal"
        >
          Ver cardápio completo →
        </Link>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group overflow-hidden rounded-3xl border border-border bg-charcoal/50"
          >
            <div className="aspect-square overflow-hidden bg-charcoal">
              <img
                src={it.img}
                alt={it.name}
                loading="lazy"
                className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
              />
            </div>
            <div className="flex items-center justify-between p-5">
              <div>
                <div className="font-display text-xl">{it.name}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Adicionar</div>
              </div>
              <div className="font-display text-2xl text-ember">{it.price}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="border-y border-border bg-charcoal/30 py-20">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-10 px-6 md:grid-cols-4">
        {[
          ["1,2M", "Pedidos processados"],
          ["480+", "Restaurantes ativos"],
          ["42s", "Tempo até pedir"],
          ["4,9★", "Avaliação dos clientes"],
        ].map(([v, l]) => (
          <div key={l} className="text-center">
            <div className="font-display text-5xl text-gradient-ember md:text-6xl">{v}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Loyalty() {
  return (
    <section id="loyalty" className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ember">Recompensas</p>
          <h2 className="mt-3 font-display text-5xl md:text-6xl">Cada mordida vira faísca.</h2>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Programa de fidelidade nativo. Pontos por pedido, carteira de cashback,
            níveis VIP, recompensas de aniversário e bônus por indicação — tudo automático.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[["Bronze", "5%"], ["Prata", "8%"], ["Ember", "12%"]].map(([t, c]) => (
              <div key={t} className="rounded-2xl border border-border bg-charcoal/50 p-5 text-center">
                <div className="font-display text-2xl">{t}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">cashback</div>
                <div className="mt-3 font-display text-3xl text-ember">{c}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-ember/10 blur-3xl" />
          <div className="relative rounded-3xl border border-border bg-gradient-to-br from-charcoal to-background p-8 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Carteira</div>
              <Flame className="h-5 w-5 text-ember" />
            </div>
            <div className="mt-6 font-display text-6xl text-gradient-ember">2.480</div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">faíscas disponíveis</div>
            <div className="mt-8 h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-3/4 rounded-full bg-ember" />
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Prata</span>
              <span>520 para Ember</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">Shake grátis</div>
                <div className="mt-1 font-display text-xl">800 fa</div>
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="text-xs text-muted-foreground">Upgrade combo</div>
                <div className="mt-1 font-display text-xl">1.500 fa</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    { q: "Giramos 38% mais mesas numa sexta. A equipe só cozinha agora.", a: "Marco — Dono, Smashlab Burgers" },
    { q: "Os clientes amam. Ticket médio subiu R$ 14 com upsell por IA.", a: "Lina — Gerente, Coast Lanchonete" },
    { q: "Configurei numa tarde. Melhor decisão operacional do ano.", a: "Jay — Fundador, Pier 9 Pub" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-28">
      <p className="text-xs uppercase tracking-[0.3em] text-ember text-center">Amado pelos operadores</p>
      <h2 className="mt-3 text-center font-display text-5xl md:text-6xl">Cozinhas reais. Números reais.</h2>
      <div className="mt-16 grid gap-6 md:grid-cols-3">
        {quotes.map((q) => (
          <div key={q.a} className="rounded-3xl border border-border bg-charcoal/50 p-8">
            <div className="text-ember">★★★★★</div>
            <p className="mt-4 text-lg leading-relaxed">"{q.q}"</p>
            <div className="mt-6 text-sm text-muted-foreground">{q.a}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="relative mx-auto max-w-7xl px-6 py-28">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-br from-charcoal via-background to-charcoal p-12 md:p-20">
        <div className="absolute inset-0 bg-ember-radial" />
        <div className="relative text-center">
          <h2 className="font-display text-5xl md:text-7xl">
            Acenda seu <span className="text-gradient-ember">restaurante.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Teste o fluxo do cliente agora — sem cadastro, sem instalar nada.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/menu"
              search={{ table: "12" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-ember transition hover:scale-[1.03]"
            >
              <QrCode className="h-5 w-5" />
              Abrir demo da mesa 12
            </Link>
            <a
              href="https://wa.me/15555555555"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-charcoal/60 px-8 py-4 text-base font-semibold backdrop-blur transition hover:bg-charcoal"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-ember" />
          <span className="font-display text-lg tracking-wider text-foreground">EMBER</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-foreground">Privacidade</a>
          <a href="#" className="hover:text-foreground">Termos</a>
          <a href="#contact" className="hover:text-foreground">Contato</a>
        </div>
      </div>
    </footer>
  );
}
