import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProtectedRoute } from '../../components/rbac/ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { useRBAC } from '../../hooks/useRBAC';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../hooks/useRBAC', () => ({
  useRBAC: vi.fn(),
}));

describe('ProtectedRoute', () => {
  it('should redirect to login if not authenticated', () => {
    (useAuth as any).mockReturnValue({ user: null, loading: false });
    (useRBAC as any).mockReturnValue({ canAccess: () => false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should show content if authenticated and no RBAC check needed', () => {
    (useAuth as any).mockReturnValue({ user: { id: '1' }, loading: false });
    (useRBAC as any).mockReturnValue({ canAccess: () => true, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('should show access denied if RBAC check fails', () => {
    (useAuth as any).mockReturnValue({ user: { id: '1' }, loading: false });
    (useRBAC as any).mockReturnValue({ canAccess: () => false, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute requiredRole="admin">
          <div data-testid="protected-content">Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});
