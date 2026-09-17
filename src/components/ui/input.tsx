import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ className, label, error, id, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <input
        id={inputId}
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-muted/60 px-3 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/40",
          error && "border-danger",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ className, label, ...props }: TextareaProps) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <textarea
        className={cn(
          "min-h-24 w-full rounded-lg border border-border bg-muted/60 px-3 py-2 text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/40",
          className,
        )}
        {...props}
      />
    </label>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
};

export function Select({ className, label, options, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-1.5 text-sm">
      {label ? <span className="text-muted-foreground">{label}</span> : null}
      <select
        className={cn(
          "h-10 w-full rounded-lg border border-border bg-muted/60 px-3 text-foreground outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/40",
          className,
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
