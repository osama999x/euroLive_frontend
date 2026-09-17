"use client";

import { useState, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  error?: string;
};

export function PasswordInput({
  className,
  label = "Password",
  error,
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name ?? "password";

  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <span className="relative block">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          className={cn(
            "h-10 w-full rounded-lg border border-border bg-muted/60 px-3 pr-16 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/40",
            error && "border-danger",
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-primary transition hover:bg-primary/10"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </span>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
