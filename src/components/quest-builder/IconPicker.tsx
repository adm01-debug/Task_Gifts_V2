import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const EMOJI_CATEGORIES = {
  "Educação": ["📚", "📖", "📝", "✏️", "🎓", "📊", "📈", "💡", "🧠", "📐"],
  "Tecnologia": ["💻", "🖥️", "📱", "⚙️", "🔧", "🔌", "💾", "🔐", "🌐", "📡"],
  "Negócios": ["💼", "📋", "🎯", "🏆", "💰", "📌", "🗂️", "📁", "✅", "🔔"],
  "Comunicação": ["💬", "📢", "📧", "📞", "🤝", "👥", "🗣️", "📣", "✉️", "📩"],
  "Criatividade": ["🎨", "🎭", "🎬", "📷", "🎵", "✨", "🌟", "💎", "🔮", "🎪"],
  "Bem-estar": ["❤️", "🏃", "🧘", "🌱", "☀️", "🌈", "🎉", "🙌", "💪", "🌻"],
};

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-16 w-16 text-3xl hover:scale-105 transition-transform"
        >
          {value || "📚"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-foreground">Escolha um ícone</h4>
          
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <div key={category}>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {category}
              </p>
              <div className="grid grid-cols-10 gap-1">
                {emojis.map((emoji) => (
                  <motion.button
                    key={emoji}
                    type="button"
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleSelect(emoji)}
                    className={`flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-muted ${
                      value === emoji ? "bg-primary/20 ring-2 ring-primary" : ""
                    }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
