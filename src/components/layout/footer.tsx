import { cn } from "@/lib/utils";

type FooterProps = {
  className?: string;
};

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("border-t border-border", className)}>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-6 text-sm text-muted-foreground sm:px-6">
        <p>Euro Live</p>
        <p>Built with Next.js + Tailwind CSS</p>
      </div>
    </footer>
  );
}
