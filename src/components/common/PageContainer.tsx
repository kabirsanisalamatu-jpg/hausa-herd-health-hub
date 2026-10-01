import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Responsive page wrapper: mobile-first padding, centred max width. */
export function PageContainer({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "main" | "section";
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12", className)}>
      {children}
    </Tag>
  );
}
