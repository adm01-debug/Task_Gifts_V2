import { memo } from "react";
import { motion } from "framer-motion";
import { 
  Accessibility, 
  Eye, 
  Type, 
  Sparkles, 
  MousePointer2,
  Volume2,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccessibility } from "./AccessibilityProvider";
import { cn } from "@/lib/utils";

interface AccessibilitySettingsProps {
  className?: string;
}

/**
 * AccessibilitySettings - UI for configuring accessibility options
 */
export const AccessibilitySettings = memo(function AccessibilitySettings({
  className,
}: AccessibilitySettingsProps) {
  const { settings, updateSetting, toggleSetting, resetSettings } = useAccessibility();

  const settingsGroups = [
    {
      title: "Movimento",
      description: "Controle animações e transições",
      items: [
        {
          id: "reducedMotion",
          label: "Reduzir movimento",
          description: "Minimiza animações e efeitos de transição",
          icon: <Sparkles className="h-4 w-4" />,
          type: "toggle" as const,
        },
      ],
    },
    {
      title: "Visualização",
      description: "Ajuste cores e tamanhos",
      items: [
        {
          id: "highContrast",
          label: "Alto contraste",
          description: "Aumenta o contraste entre cores",
          icon: <Eye className="h-4 w-4" />,
          type: "toggle" as const,
        },
        {
          id: "fontSize",
          label: "Tamanho da fonte",
          description: "Ajuste o tamanho do texto",
          icon: <Type className="h-4 w-4" />,
          type: "select" as const,
          options: [
            { value: "normal", label: "Normal" },
            { value: "large", label: "Grande" },
            { value: "larger", label: "Muito grande" },
          ],
        },
      ],
    },
    {
      title: "Navegação",
      description: "Personalize a interação",
      items: [
        {
          id: "focusVisible",
          label: "Destaque de foco",
          description: "Mostra indicadores de foco visíveis",
          icon: <MousePointer2 className="h-4 w-4" />,
          type: "toggle" as const,
        },
        {
          id: "screenReaderMode",
          label: "Modo leitor de tela",
          description: "Otimiza para leitores de tela",
          icon: <Volume2 className="h-4 w-4" />,
          type: "toggle" as const,
        },
      ],
    },
  ];

  return (
    <Card className={cn("w-full max-w-xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Accessibility className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Acessibilidade</CardTitle>
              <CardDescription>
                Personalize sua experiência
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetSettings}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
          >
            {groupIndex > 0 && <Separator className="mb-6" />}
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm">{group.title}</h3>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>

              <div className="space-y-4">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={item.id} className="text-sm font-medium">
                          {item.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {item.type === "toggle" && (
                      <Switch
                        id={item.id}
                        checked={settings[item.id as keyof typeof settings] as boolean}
                        onCheckedChange={() => 
                          toggleSetting(item.id as keyof Omit<typeof settings, "fontSize">)
                        }
                      />
                    )}

                    {item.type === "select" && item.options && (
                      <Select
                        value={settings.fontSize}
                        onValueChange={(value) => 
                          updateSetting("fontSize", value as typeof settings.fontSize)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {item.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
});
