import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates 0 → target once `run` becomes true.
 * Returns the current value so the caller can also drive rings/bars with it.
 */
export function useCountUp(target: number, run: boolean, { duration = 1800, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        setValue(target * easeOutExpo(t));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, run, duration, delay, reduced]);

  return value;
}
