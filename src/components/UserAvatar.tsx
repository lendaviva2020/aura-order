import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  url?: string | null;
  name?: string | null;
  className?: string;
  iconClassName?: string;
}

export function UserAvatar({ url, name, className, iconClassName }: UserAvatarProps) {
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-full bg-charcoal/60 grid place-items-center shrink-0",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? "Avatar"} className="h-full w-full object-cover" />
      ) : initials ? (
        <span className="font-display text-foreground/80 leading-none">{initials}</span>
      ) : (
        <User className={cn("text-muted-foreground", iconClassName ?? "h-1/2 w-1/2")} />
      )}
    </div>
  );
}
