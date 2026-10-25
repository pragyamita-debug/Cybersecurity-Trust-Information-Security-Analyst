import { useCallback, useRef } from 'react';

/**
 * Pointer-follow spotlight + subtle 3D tilt.
 * Writes CSS custom properties (--mx, --my, --rx, --ry) straight to the element
 * so React doesn't re-render on every mouse move.
 */
export function usePointerGlow<T extends HTMLElement>({ tilt = 6 } = {}) {
  const ref = useRef<T>(null);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<T>) => {
      const el = ref.current;
      if (!el || e.pointerType === 'touch') return;
      const { clientX, clientY } = e;
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const px = (clientX - r.left) / r.width;
        const py = (clientY - r.top) / r.height;
        el.style.setProperty('--mx', `${px * 100}%`);
        el.style.setProperty('--my', `${py * 100}%`);
        el.style.setProperty('--rx', `${(0.5 - py) * tilt}deg`);
        el.style.setProperty('--ry', `${(px - 0.5) * tilt}deg`);
      });
    },
    [tilt],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cancelAnimationFrame(frame.current);
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}
