import { flushSync } from 'react-dom';
import { useNavigate, NavigateOptions, To } from 'react-router-dom';

/**
 * useViewTransition - Hook para navegação usando a View Transitions API
 * Proporciona transições nativas e fluidas entre estados da página
 */
export const useViewTransition = () => {
  const navigate = useNavigate();

  const navigateWithTransition = (to: To, options?: NavigateOptions) => {
    if (!document.startViewTransition) {
      navigate(to, options);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        navigate(to, options);
      });
    });
  };

  return navigateWithTransition;
};