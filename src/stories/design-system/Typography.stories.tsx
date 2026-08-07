import type { Meta, StoryObj } from "@storybook/react";

const TypographyShowcase = () => (
  <div className="space-y-8 p-6">
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Font Family</h2>
      <div className="p-6 rounded-lg bg-card border border-border">
        <p className="text-4xl font-bold text-foreground mb-2">Plus Jakarta Sans</p>
        <p className="text-muted-foreground">
          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
        </p>
        <p className="text-muted-foreground">
          a b c d e f g h i j k l m n o p q r s t u v w x y z
        </p>
        <p className="text-muted-foreground">
          0 1 2 3 4 5 6 7 8 9
        </p>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Headings</h2>
      <div className="space-y-4 p-6 rounded-lg bg-card border border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-4xl / 36px</p>
          <h1 className="text-4xl font-bold text-foreground">Heading 1 - Dashboard Principal</h1>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-3xl / 30px</p>
          <h2 className="text-3xl font-bold text-foreground">Heading 2 - Seção de Metas</h2>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-2xl / 24px</p>
          <h3 className="text-2xl font-semibold text-foreground">Heading 3 - Card Title</h3>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-xl / 20px</p>
          <h4 className="text-xl font-semibold text-foreground">Heading 4 - Subsection</h4>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-lg / 18px</p>
          <h5 className="text-lg font-medium text-foreground">Heading 5 - Label</h5>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Body Text</h2>
      <div className="space-y-4 p-6 rounded-lg bg-card border border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-base / 16px</p>
          <p className="text-base text-foreground">
            Texto base para parágrafos e conteúdo principal. A plataforma Task Gifts 
            oferece gamificação corporativa para engajar colaboradores.
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-sm / 14px</p>
          <p className="text-sm text-muted-foreground">
            Texto secundário para descrições e informações complementares.
            Usado em cards e tooltips.
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">text-xs / 12px</p>
          <p className="text-xs text-muted-foreground">
            Texto pequeno para labels, timestamps e metadados.
          </p>
        </div>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Font Weights</h2>
      <div className="space-y-2 p-6 rounded-lg bg-card border border-border">
        <p className="text-xl font-normal text-foreground">Font Weight 400 - Normal</p>
        <p className="text-xl font-medium text-foreground">Font Weight 500 - Medium</p>
        <p className="text-xl font-semibold text-foreground">Font Weight 600 - Semibold</p>
        <p className="text-xl font-bold text-foreground">Font Weight 700 - Bold</p>
        <p className="text-xl font-extrabold text-foreground">Font Weight 800 - Extrabold</p>
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Gamification Numbers</h2>
      <div className="flex gap-6 p-6 rounded-lg bg-card border border-border">
        <div className="text-center">
          <p className="text-4xl font-bold text-xp">+150</p>
          <p className="text-xs text-muted-foreground">XP Gained</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-coins">500</p>
          <p className="text-xs text-muted-foreground">Coins</p>
        </div>
        <div className="text-center">
          <p className="text-4xl font-bold text-streak">7🔥</p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </div>
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: "Design System/Typography",
  component: TypographyShowcase,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Sistema tipográfico do Task Gifts usando Plus Jakarta Sans.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const AllTypography: Story = {};
