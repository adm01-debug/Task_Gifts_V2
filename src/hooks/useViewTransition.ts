import { flushSync } from 'react-dom';
import { useNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * useViewTransition - Hook para navegação usando a View Transitions API
 * Proporciona transições nativas e fluidas entre estados da página
 */
export const useViewTransition = () => {
  const navigate = useNavigate();

  const navigateWithTransition = (to: To, options?: NavigateOptions) => {
    // @ts-ignore - View Transitions API ainda não está no TS oficial em todos os lugares
    if (!document.startViewTransition) {
      navigate(to, options);
      return;
    }

    // @ts-ignore
    document.startViewTransition(() => {
      flushSync(() => {
        navigate(to, options);
      });
    });
  };

  return navigateWithTransition;
};