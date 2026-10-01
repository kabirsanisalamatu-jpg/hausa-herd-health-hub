import { useContext } from "react";
import { LanguageContext, type LanguageContextValue } from "@/contexts/LanguageContext";

export function useTranslation(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used inside <LanguageProvider>");
  }
  return context;
}
