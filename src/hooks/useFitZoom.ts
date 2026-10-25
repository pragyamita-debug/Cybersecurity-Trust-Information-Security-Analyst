import { useEffect, useState } from 'react';

/**
 * Between `min` and `design` px wide, returns the zoom that fits a `design`-px layout into the viewport,
 * so narrow windows (split screens, preview panes) get the full desktop composition scaled down instead of
 * a stacked layout. Below `min` it returns 1 and the CSS stacks the layout for phones.
 */
export function useFitZoom(design = 1240, min = 680) {
  const get = () => {
    if (typeof window === 'undefined') return 1;
    const w = document.documentElement.clientWidth;
    return w >= design || w < min ? 1 : w / design;
  };
  const [zoom, setZoom] = useState(get);
  useEffect(() => {
    const on = () => setZoom(get());
    on();
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return zoom;
}
