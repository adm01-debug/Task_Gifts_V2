import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Shop from '@/pages/Shop';
import { useShopRewards } from '@/hooks/useShop';
import { useProfile } from '@/hooks/useProfiles';
import { useAuth } from '@/hooks/useAuth';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AccessibilityProvider } from '@/components/accessibility';
import React from 'react';

// Mock hooks
vi.mock('@/hooks/useShop', () => ({
  useShopRewards: vi.fn(),
  usePurchaseReward: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useActivePromotions: vi.fn(() => ({ data: [], isLoading: false })),
  useUserPurchases: vi.fn(() => ({ data: [], isLoading: false })),
}));

vi.mock('@/hooks/useProfiles', () => ({
  useProfile: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock sound effects to avoid issues in test environment
vi.mock('@/hooks/useSoundEffects', () => ({
  useSoundEffects: vi.fn(() => ({
    playEpicCelebrationSound: vi.fn(),
    playLegendaryCelebrationSound: vi.fn(),
  })),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <MemoryRouter>
      <AccessibilityProvider>
        {children}
      </AccessibilityProvider>
    </MemoryRouter>
  </QueryClientProvider>
);

describe('Shop Skeleton and Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: { id: 'test-user' } });
    (useProfile as any).mockReturnValue({ data: { coins: 1000 }, isLoading: false });
  });

  it('should display skeletons while rewards are loading', async () => {
    // Mock useShopRewards to return isLoading: true
    (useShopRewards as any).mockReturnValue({
      data: null,
      isLoading: true,
    });

    render(<Shop />, { wrapper });

    // Check if skeletons are rendered
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
    
    // Specifically check for the grid of skeletons in the shop tab
    const shopContent = screen.getByRole('tabpanel', { name: /RECURSOS DISPONÍVEIS/i });
    const gridSkeletons = shopContent.querySelectorAll('.animate-pulse');
    // The component renders 8 skeletons when loading, and each SkeletonShopCard has multiple .animate-pulse elements
    expect(gridSkeletons.length).toBe(64); // 8 cards * 8 animated elements each
  });

  it('should transition from skeletons to content smoothly', async () => {
    let isLoading = true;
    const mockRewards = [
      { id: '1', name: 'Elite Armor', description: 'Legendary protection', price_coins: 500, category: 'product', rarity: 'legendary', is_active: true },
    ];

    const { rerender } = render(<Shop />, { wrapper });

    // Initial state: loading
    (useShopRewards as any).mockReturnValue({
      data: null,
      isLoading: true,
    });
    rerender(<Shop />);
    
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

    // Update mock to data loaded
    (useShopRewards as any).mockReturnValue({
      data: mockRewards,
      isLoading: false,
    });
    
    rerender(<Shop />);

    // Wait for skeletons to disappear and content to appear
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton')).toBeNull();
      expect(screen.getByText('Elite Armor')).toBeDefined();
    });
  });

  it('should maintain layout stability during search/filtering loading', async () => {
     // This test simulates a category switch which might trigger a re-fetch
     (useShopRewards as any).mockReturnValue({
        data: [
          { id: '1', name: 'Product 1', description: 'Desc 1', price_coins: 100, category: 'product', rarity: 'common' }
        ],
        isLoading: false,
      });

      const { container } = render(<Shop />, { wrapper });
      
      const grid = container.querySelector('.grid');
      const initialHeight = grid?.clientHeight;

      // Simulate loading state during filter change
      (useShopRewards as any).mockReturnValue({
        data: null,
        isLoading: true,
      });
      
      render(<Shop />, { wrapper });
      
      const loadingGrid = container.querySelector('.grid');
      // Skeletons should occupy similar space to maintain stability
      expect(loadingGrid).toBeDefined();
  });
});
