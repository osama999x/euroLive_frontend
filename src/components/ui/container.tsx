import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ContainerProps = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
};

export function Container({
  as: Component = "div",
  children,
  className,
}: ContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6", className)}
    >
      {children}
    </Component>
  );
}
