import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/** Centered card shell shared by the sign-in, sign-up and password pages. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle as-child="true" className="text-2xl">
            <h1>{title}</h1>
          </CardTitle>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}

/** Labelled form field with an associated, announced error message. */
export function AuthField({ id, label, hint, error, children }: { id: string; label: string; hint?: string; error: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p> : null}
    </div>
  );
}

export function fieldA11y(id: string, error: unknown) {
  return { id, "aria-invalid": !!error, "aria-describedby": error ? `${id}-error` : undefined };
}
