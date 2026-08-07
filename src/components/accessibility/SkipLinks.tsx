import { memo } from "react";
import { cn } from "@/lib/utils";

interface SkipLink {
  id: string;
  label: string;
  target: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { id: "skip-main", label: "Ir para conteúdo principal", target: "#main-content" },
  { id: "skip-nav", label: "Ir para navegação", target: "#main-nav" },
  { id: "skip-search", label: "Ir para busca", target: "#search-input" },
];

/**
 * SkipLinks - Hidden links that become visible on focus for keyboard navigation
 */
export const SkipLinks = memo(function SkipLinks({
  links = defaultLinks,
  className,
}: SkipLinksProps) {
  return (
    <div className={cn("skip-links", className)}>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.target}
          className={cn(
            "sr-only focus:not-sr-only",
            "focus:fixed focus:top-4 focus:left-4 focus:z-[9999]",
            "focus:px-4 focus:py-2 focus:rounded-lg",
            "focus:bg-primary focus:text-primary-foreground",
            "focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "transition-all duration-200"
          )}
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.target);
            if (target) {
              target.scrollIntoView({ behavior: "smooth" });
              (target as HTMLElement).focus?.();
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
});
