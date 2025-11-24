import { useCallback } from 'react';

const useHaptics = () => {
  const triggerHaptic = useCallback((type) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    switch (type) {
      case 'success':
        navigator.vibrate([50, 50, 50]);
        break;
      case 'error':
        navigator.vibrate([50, 100, 50, 100, 50]);
        break;
      case 'warning':
        navigator.vibrate([100, 50, 100]);
        break;
      case 'light':
        navigator.vibrate(10);
        break;
      case 'ultra-light':
        navigator.vibrate(5);
        break;
      case 'medium':
        navigator.vibrate(40);
        break;
      case 'heavy':
        navigator.vibrate(80);
        break;
      case 'selection':
        navigator.vibrate(15);
        break;
      default:
        navigator.vibrate(20);
    }
  }, []);

  return { triggerHaptic };
};

export default useHaptics;
