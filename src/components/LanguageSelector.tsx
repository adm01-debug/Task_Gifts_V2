/**
 * LanguageSelector Component
 * Allows users to change the application language
 */

import { memo, useCallback } from 'react';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n, localeDisplayNames, localeFlags } from '@/hooks/useI18n';
import { SupportedLocale } from '@/i18n/translations';
import { cn } from '@/lib/utils';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSelector = memo(function LanguageSelector({
  compact = false,
  className,
}: LanguageSelectorProps) {
  const { locale, setLocale, supportedLocales } = useI18n();

  const handleChange = useCallback(
    (value: string) => {
      setLocale(value as SupportedLocale);
    },
    [setLocale]
  );

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger
        className={cn(
          'gap-2',
          compact ? 'w-[70px]' : 'w-[180px]',
          className
        )}
        aria-label="Selecionar idioma"
      >
        <Globe className="h-4 w-4 text-muted-foreground" />
        <SelectValue>
          {compact ? localeFlags[locale] : localeDisplayNames[locale]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {supportedLocales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            <span className="flex items-center gap-2">
              <span>{localeFlags[loc]}</span>
              {!compact && <span>{localeDisplayNames[loc]}</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
