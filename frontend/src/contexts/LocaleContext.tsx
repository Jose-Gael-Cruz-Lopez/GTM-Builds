import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  detectLocale,
  dictionaries,
  persistLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  d: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Start with 'es' to avoid hydration mismatch; detect real preference on mount.
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    setLocaleState(detectLocale());
  }, []);

  // Keep <html lang> in sync for screen readers and SEO crawlers that execute JS.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(next: Locale): void {
    persistLocale(next);
    setLocaleState(next);
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, d: dictionaries[locale] }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}
