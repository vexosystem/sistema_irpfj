import { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function FormField({ label, error, hint, children }: FormFieldProps) {
  return (
    <label className="block space-y-2">
      <div className="space-y-1">
        <span className="text-sm font-semibold text-foreground">{label}</span>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
      {children}
      {error ? <span className="text-xs font-medium text-danger">{error}</span> : null}
    </label>
  );
}
