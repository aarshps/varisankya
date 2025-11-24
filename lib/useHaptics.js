import { useCallback, useRef } from 'react';

// Global flag to track if haptics API is initialized
let hapticsInitialized = false;

const useHaptics = () => {
  const triggerHaptic = useCallback((type) => {
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    let duration;
    switch (type) {
      case 'success':
        duration = [50, 50, 50];
        break;
      case 'error':
        duration = [50, 100, 50, 100, 50];
        break;
      case 'warning':
        duration = [100, 50, 100];
        break;
      case 'light':
        duration = 10;
        break;
      case 'ultra-light':
        duration = 2;
        break;
      case 'medium':
        duration = 40;
        break;
      case 'heavy':
        duration = 80;
        break;
      case 'selection':
        duration = 15;
        break;
      default:
        duration = 20;
    }

    try {
      navigator.vibrate(duration);
      hapticsInitialized = true;
    } catch (e) {
      console.debug('Haptics failed:', e);
    }
  }, []);

  const isHapticsReady = useCallback(() => {
    return hapticsInitialized;
  }, []);

  return { triggerHaptic, isHapticsReady };
};

export default useHaptics;
