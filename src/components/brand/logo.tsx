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
  lg: { box: "h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36", img: 144 },
} as const;

export function BrandLogo({
  className,
  href = "/",
  size = "md",
  showWordmark = false,
}: BrandLogoProps) {
  const s = sizes[size];
  const content = (
    <span className={cn("inline-flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <span
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full ring-1 ring-primary/40",
          s.box,
        )}
      >
        <Image
          src="/brand/euro-live-logo.jpg"
          alt="Euro Live"
          width={s.img}
          height={s.img}
          className="h-full w-full object-cover"
          priority
          loading="eager"
        />
      </span>
      {showWordmark ? (
        <span className="truncate font-display text-lg font-semibold tracking-wide text-gold-gradient sm:text-xl">
          Euro Live
        </span>
      ) : null}
    </span>
  );

  if (href === null) return content;
  return (
    <Link href={href} className="inline-flex min-w-0">
      {content}
    </Link>
  );
}
