import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RewardCard } from "@/components/shop/RewardCard";
import type { ShopReward } from "@/services/shopService";

const baseReward: ShopReward = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Caneca Personalizada",
  description: "Caneca de ceramica 300ml",
  category: "product",
  price_coins: 150,
  stock: 10,
  image_url: null,
  rarity: "common",
  is_active: true,
  created_at: "2026-11-25T00:00:00Z",
  updated_at: "2026-11-25T00:00:00Z",
};

const renderCard = (reward: ShopReward) =>
  render(
    <RewardCard
      reward={reward}
      userCoins={500}
      onPurchase={() => {}}
      purchasingRewardId={null}
    />,
  );

describe("RewardCard imagem do premio", () => {
  it("mostra a foto quando o premio tem image_url", () => {
    renderCard({ ...baseReward, image_url: "https://cdn.example.com/caneca.png" });

    const img = screen.getByRole("img", { name: "Caneca Personalizada" });
    expect(img).toHaveAttribute("src", "https://cdn.example.com/caneca.png");
  });

  it("cai no icone da categoria quando nao ha image_url", () => {
    renderCard(baseReward);

    expect(screen.queryByRole("img")).toBeNull();
  });
});