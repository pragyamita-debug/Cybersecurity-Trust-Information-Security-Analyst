import { useLayoutEffect, useState, type RefObject } from 'react';

type Side = 'left' | 'right' | 'up' | 'down';
type Tone = 'blue' | 'orange';

interface Strand {
  id: string;
  key: string;
  d: string;
  tone: Tone;
  /** 0–1, main strand of a bundle is brightest */
  weight: number;
  delay: number;
}

const BUNDLE = 3;

/**
 * Glowing data strands from the hub to every element marked `data-flow="left|right|up|down"`.
 * Positions are measured from the DOM (and re-measured on resize), so the lines always land on
 * the panels whatever the CV content does to their height.
 */
export function FlowLines({ root, hot }: { root: RefObject<HTMLElement>; hot: string | null }) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [strands, setStrands] = useState<Strand[]>([]);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const base = el.getBoundingClientRect();
      const core = el.querySelector<HTMLElement>('[data-hub]');
      // hidden on small screens (the layout stacks and the lines would have nowhere to go)
      if (!core || core.offsetParent === null || window.innerWidth < 1100) {
        setStrands([]);
        return;
      }
      const c = core.getBoundingClientRect();
      const cx = c.left + c.width / 2 - base.left;
      const cy = c.top + c.height / 2 - base.top;
      const r = c.width / 2;
      const out: Strand[] = [];

      el.querySelectorAll<HTMLElement>('[data-flow]').forEach((a, n) => {
        const side = a.dataset.flow as Side;
        const tone = (a.dataset.tone as Tone) || 'blue';
        const key = a.dataset.key || String(n);
        const ar = a.getBoundingClientRect();
        const ex = (side === 'left' ? ar.right : side === 'right' ? ar.left : ar.left + ar.width / 2) - base.left;
        const ey = (side === 'up' ? ar.bottom : side === 'down' ? ar.top : ar.top + ar.height / 2) - base.top;

        for (let s = 0; s < BUNDLE; s++) {
          const spread = (s - (BUNDLE - 1) / 2) * (side === 'up' || side === 'down' ? 7 : 0.07);
          let d: string;
          if (side === 'up' || side === 'down') {
            const dir = side === 'up' ? -1 : 1;
            const sx = cx + spread;
            const sy = cy + dir * r;
            const mid = (sy + ey) / 2;
            d = `M${sx},${sy} C${sx},${mid} ${ex + spread * 0.4},${mid} ${ex + spread * 0.4},${ey}`;
          } else {
            const ang = Math.atan2(ey - cy, ex - cx) + spread;
            const sx = cx + Math.cos(ang) * r;
            const sy = cy + Math.sin(ang) * r;
            const k = Math.abs(ex - sx) * 0.55;
            const dir = side === 'left' ? -1 : 1;
            // strands leave the hub radially, then ease into horizontal as they reach the panel
            const c1x = sx + Math.cos(ang) * k * 0.5;
            const c1y = sy + Math.sin(ang) * k * 0.5;
            const c2x = ex - dir * k;
            const c2y = ey + (s - 1) * 2;
            d = `M${sx.toFixed(1)},${sy.toFixed(1)} C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`;
          }
          out.push({ id: `${key}-${s}`, key, d, tone, weight: s === 1 ? 1 : 0.55, delay: ((n * 0.37 + s * 0.9) % 4) });
        }
      });
      setBox({ w: base.width, h: base.height });
      setStrands(out);
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    el.querySelectorAll('[data-flow], [data-hub]').forEach((n) => ro.observe(n));
    window.addEventListener('resize', schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [root]);

  if (!strands.length) return null;

  return (
    <svg className="flows" width={box.w} height={box.h} viewBox={`0 0 ${box.w} ${box.h}`} aria-hidden>
      <defs>
        <filter id="flow-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g className="flows__base">
        {strands.map((s) => (
          <path key={s.id} id={`flow-${s.id}`} d={s.d} className={`flow flow--${s.tone} ${hot === s.key ? 'is-hot' : ''}`} style={{ opacity: 0.18 + s.weight * 0.3 }} />
        ))}
      </g>
      <g className="flows__pulse" filter="url(#flow-glow)">
        {strands.map((s) => (
          <path
            key={s.id}
            d={s.d}
            pathLength={100}
            className={`pulse pulse--${s.tone} ${hot === s.key ? 'is-hot' : ''}`}
            style={{ animationDelay: `${-s.delay}s`, opacity: s.weight }}
          />
        ))}
      </g>
      {/* packets riding the main strand of every bundle */}
      <g className="flows__packets">
        {strands
          .filter((s) => s.weight === 1)
          .map((s, i) => (
            <circle key={s.id} r={hot === s.key ? 3.2 : 2.2} className={`packet packet--${s.tone}`}>
              {/* sources (blue) stream into the hub; the hub streams out to uses (amber) */}
              <animateMotion dur={`${3.2 + (i % 4) * 0.6}s`} begin={`${-(i * 0.71) % 3}s`} repeatCount="indefinite" keyPoints={s.tone === 'blue' ? '1;0' : '0;1'} keyTimes="0;1" calcMode="linear">
                <mpath href={`#flow-${s.id}`} />
              </animateMotion>
            </circle>
          ))}
      </g>
    </svg>
  );
}
