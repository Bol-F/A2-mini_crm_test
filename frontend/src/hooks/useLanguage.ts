import { useContext } from "react";

import { LanguageContext } from "../lib/language-context";

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === null) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
}
