import { useCallback, useRef } from 'react';

// Global flag to track if haptics API is initialized
let hapticsInitialized = false;

// Export function to mark haptics as initialized
export const markHapticsInitialized = () => {
  hapticsInitialized = true;
};

const useHaptics = () => {
  const triggerHaptic = useCallback((type) => {
    // CRITICAL: Check if initialized first - don't even try if not ready
    if (!hapticsInitialized) return;
    if (typeof navigator === 'undefined' || !navigator.vibrate) return;

    let duration;
    switch (type) {
      case 'success':
        duration = [20, 30, 20];
        break;
      case 'error':
        duration = [30, 50, 30, 50, 30];
        break;
      case 'warning':
        duration = [50, 30, 50];
        break;
      case 'light':
        duration = 5;
        break;
      case 'ultra-light':
        duration = 2;
        break;
      case 'medium':
        duration = 20;
        break;
      case 'heavy':
        duration = 40;
        break;
      case 'selection':
        duration = 8;
        break;
      default:
        duration = 10;
    }

    try {
      navigator.vibrate(duration);
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
