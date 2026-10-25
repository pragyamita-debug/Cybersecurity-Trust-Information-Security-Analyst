import { useEffect, useState } from 'react';

/** Returns the id of the section currently nearest the top of the viewport. */
export function useScrollSpy(ids: string[], offset = 120) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      // pick the section whose top has most recently passed the offset line,
      // regardless of the order the ids are listed in
      let current = ids[0];
      let best = -Infinity;
      let lowest = { id: ids[0], top: -Infinity };
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top - offset;
        // cards that share a row share a top; let the link the user clicked win the tie
        const tie = Math.abs(top - best) < 2 && location.hash === `#${id}`;
        if (top <= 0 && (top > best + 2 || tie)) {
          best = Math.max(best, top);
          current = id;
        }
        if (top > lowest.top) lowest = { id, top };
      }
      // bottom of the page: highlight the section lowest on the page
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = lowest.id;
      setActive(current);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ids, offset]);

  return active;
}
