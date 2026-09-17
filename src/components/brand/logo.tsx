import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const sizes = {
  sm: { box: "h-10 w-10", img: 40 },
  md: { box: "h-14 w-14", img: 56 },
  lg: { box: "h-28 w-28 sm:h-36 sm:w-36", img: 144 },
} as const;

export function BrandLogo({
  className,
  href = "/",
  size = "md",
  showWordmark = false,
}: BrandLogoProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative overflow-hidden rounded-full ring-1 ring-primary/40",
          s.box,
        )}
      >
        <Image
          src="/brand/euro-live-logo.jpg"
          alt="Euro Live"
          width={s.img}
          height={s.img}
          className="h-full w-full object-cover"
          priority={size === "lg"}
        />
      </span>
      {showWordmark ? (
        <span className="font-display text-xl font-semibold tracking-wide text-gold-gradient">
          Euro Live
        </span>
      ) : null}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} className="inline-flex shrink-0">
      {content}
    </Link>
  );
}
