"use client";

import { ReactNode } from "react";
import { NavigationProvider } from "@/lib/navigation-context";
import { I18nProvider } from "@/lib/i18n";
import PresentationCanvas from "@/components/phone/PresentationCanvas";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <NavigationProvider>
        <PresentationCanvas />
      </NavigationProvider>
    </I18nProvider>
  );
}
