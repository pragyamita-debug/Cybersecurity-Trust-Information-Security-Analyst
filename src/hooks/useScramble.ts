import { useEffect, useState } from 'react';
import { useReducedMotion } from './useReducedMotion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&';

/** Decodes text character by character, like a split-flap board settling. */
export function useScramble(text: string, run: boolean, { duration = 1100, delay = 0 } = {}) {
  const reduced = useReducedMotion();
  const [out, setOut] = useState(run && !reduced ? '' : text);

  useEffect(() => {
    if (!run) return;
    if (reduced) {
      setOut(text);
      return;
    }
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (now: number) => {
        if (!start) start = now;
        const t = Math.min(1, (now - start) / duration);
        const settled = Math.floor(t * text.length);
        let s = text.slice(0, settled);
        for (let i = settled; i < text.length; i++) {
          s += /[\s.|]/.test(text[i]) ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        setOut(s);
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [text, run, duration, delay, reduced]);

  return out;
}
