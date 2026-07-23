import { useEffect } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { hexToHslString } from "@/utils/colorContrast";

function apply(varName: string, value: string | null) {
  if (!value) {
    document.documentElement.style.removeProperty(varName);
    return;
  }
  const hsl = value.startsWith("#") ? hexToHslString(value) : value;
  if (hsl) document.documentElement.style.setProperty(varName, hsl);
}

export function ThemeInjector() {
  const { data: org } = useOrganization();

  useEffect(() => {
    if (!org) return;
    apply("--primary", org.primary_color);
    apply("--secondary", org.secondary_color);
    apply("--accent", org.accent_color);

    if (org.favicon_url) {
      let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = org.favicon_url;
    }
    if (org.name) document.title = org.name;
  }, [org]);

  return null;
}