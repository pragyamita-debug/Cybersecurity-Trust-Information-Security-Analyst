import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

type Side = 'left' | 'right' | 'up' | 'down';
type Tone = 'blue' | 'orange';
type Pt = [number, number];
type Cubic = [Pt, Pt, Pt, Pt];

/** A drawable line: `grow` is when (s) it starts growing in each cycle, so roots spread outward from the hub. */
interface Line {
  id: string;
  key: string;
  d: string;
  tone: Tone;
  kind: 'main' | 'filler' | 'root' | 'bridge';
  grow: number;
  flicker?: number;
}
interface Node {
  id: string;
  key: string;
  x: number;
  y: number;
  tone: Tone;
  blink: number;
  speed: number;
}
interface Scene {
  w: number;
  h: number;
  cx: number;
  cy: number;
  r: number;
  lines: Line[];
  nodes: Node[];
}

const GROW = 2.2; // seconds for a root to reach its panel

/* ---------- small geometry helpers ---------- */

function bez([a, b, c, d]: Cubic, t: number): Pt {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}
function tangent([a, b, c, d]: Cubic, t: number): Pt {
  const u = 1 - t;
  const x = 3 * u * u * (b[0] - a[0]) + 6 * u * t * (c[0] - b[0]) + 3 * t * t * (d[0] - c[0]);
  const y = 3 * u * u * (b[1] - a[1]) + 6 * u * t * (c[1] - b[1]) + 3 * t * t * (d[1] - c[1]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
/** de Casteljau: the part of the curve from 0 to t */
function head([a, b, c, d]: Cubic, t: number): Cubic {
  const lerp = (p: Pt, q: Pt): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const ab = lerp(a, b);
  const bc = lerp(b, c);
  const cd = lerp(c, d);
  const abc = lerp(ab, bc);
  const bcd = lerp(bc, cd);
  return [a, ab, abc, lerp(abc, bcd)];
}
const f = (n: number) => n.toFixed(1);
const cubicD = (pre: string, [, b, c, d]: Cubic) => `${pre} C${f(b[0])},${f(b[1])} ${f(c[0])},${f(c[1])} ${f(d[0])},${f(d[1])}`;

function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

interface Anchor {
  side: Side;
  tone: Tone;
  key: string;
  x: number;
  y: number;
}

/**
 * Builds the circuit-style "roots": for each side, the anchors are sorted and leave the hub as one dense
 * parallel bus, then fan out as S-curves to their panels. Between the main strands run shorter fillers that stop
 * at a node, roots branch off the mains, and small bridges link neighbouring strands.
 */
function build(anchors: Anchor[], cx: number, cy: number, r: number): { lines: Line[]; nodes: Node[] } {
  const lines: Line[] = [];
  const nodes: Node[] = [];
  const outer = r * 1.52; // just outside the hub's rings

  for (const side of ['left', 'right'] as const) {
    const group = anchors.filter((a) => a.side === side).sort((a, b) => a.y - b.y);
    const n = group.length;
    if (!n) continue;
    const dir = side === 'left' ? -1 : 1;
    const gap = Math.min(9, (r * 1.1) / n);
    const sx = cx + dir * outer;
    const curves: Cubic[] = [];
    const startY = (i: number) => cy + (i - (n - 1) / 2) * gap;
    const ringX = (y: number) => cx + dir * Math.sqrt(Math.max(0, r * r - (y - cy) ** 2));

    group.forEach((a, i) => {
      const rand = rng(a.key);
      const y0 = startY(i);
      const k = Math.abs(a.x - sx) * (0.5 + rand() * 0.12);
      const curve: Cubic = [[sx, y0], [sx + dir * k, y0], [a.x - dir * k, a.y], [a.x, a.y]];
      curves.push(curve);
      // the wave of growth starts at the middle of the bus and spreads up and down
      const wave = Math.abs(i - (n - 1) / 2) * 0.16 + (side === 'right' ? 0.35 : 0);
      lines.push({ id: `${a.key}-m`, key: a.key, tone: a.tone, kind: 'main', grow: wave, d: cubicD(`M${f(ringX(y0))},${f(y0)} L${f(sx)},${f(y0)}`, curve), flicker: rand() < 0.3 ? 1.5 + rand() * 3 : undefined });
      nodes.push({ id: `${a.key}-end`, key: a.key, x: a.x, y: a.y, tone: a.tone, blink: rand() * 3, speed: 1.6 + rand() * 1.6 });

      // one or two roots branching off the main strand, curling away from the middle of the bus
      const roots = rand() < 0.55 ? 2 : 1;
      for (let j = 0; j < roots; j++) {
        const t = 0.28 + rand() * 0.5;
        const p = bez(curve, t);
        const tg = tangent(curve, t);
        const away = i < (n - 1) / 2 ? -1 : 1;
        const ang = (away * dir * (16 + rand() * 18) * Math.PI) / 180;
        const len = 24 + rand() * 46;
        const rot: Pt = [tg[0] * Math.cos(ang) - tg[1] * Math.sin(ang), tg[0] * Math.sin(ang) + tg[1] * Math.cos(ang)];
        const e: Pt = [p[0] + rot[0] * len, p[1] + rot[1] * len];
        const c: Pt = [p[0] + tg[0] * len * 0.55, p[1] + tg[1] * len * 0.55];
        lines.push({ id: `${a.key}-r${j}`, key: a.key, tone: a.tone, kind: 'root', grow: wave + t * GROW * 0.85, d: `M${f(p[0])},${f(p[1])} Q${f(c[0])},${f(c[1])} ${f(e[0])},${f(e[1])}` });
        nodes.push({ id: `${a.key}-rn${j}`, key: a.key, x: e[0], y: e[1], tone: a.tone, blink: rand() * 3, speed: 0.9 + rand() * 1.8 });
      }
    });

    // fillers: a strand between each pair of mains that stops part-way at a node — the dense "bus" look
    for (let i = 0; i < n - 1; i++) {
      const rand = rng(`${side}-filler-${i}`);
      const a = curves[i];
      const b = curves[i + 1];
      const mid: Cubic = [0, 1, 2, 3].map((q) => [(a[q][0] + b[q][0]) / 2, (a[q][1] + b[q][1]) / 2]) as Cubic;
      const stop = 0.22 + rand() * 0.45;
      const part = head(mid, stop);
      const y0 = mid[0][1];
      const tone = group[i].tone;
      const wave = Math.abs(i + 0.5 - (n - 1) / 2) * 0.16 + (side === 'right' ? 0.35 : 0);
      lines.push({ id: `${side}-f${i}`, key: group[i].key, tone, kind: 'filler', grow: wave + 0.1, d: cubicD(`M${f(ringX(y0))},${f(y0)} L${f(sx)},${f(y0)}`, part), flicker: rand() < 0.35 ? 1 + rand() * 2.5 : undefined });
      nodes.push({ id: `${side}-fn${i}`, key: group[i].key, x: part[3][0], y: part[3][1], tone, blink: rand() * 3, speed: 1 + rand() * 2 });

      // every other pair is joined by a short bridge, so the roots connect to one another
      if (i % 2 === 0) {
        const t = 0.35 + rand() * 0.3;
        const p = bez(a, t);
        const q = bez(b, t);
        lines.push({ id: `${side}-b${i}`, key: group[i].key, tone, kind: 'bridge', grow: wave + t * GROW, d: `M${f(p[0])},${f(p[1])} L${f(q[0])},${f(q[1])}` });
        nodes.push({ id: `${side}-bn${i}a`, key: group[i].key, x: p[0], y: p[1], tone, blink: rand() * 2, speed: 0.8 + rand() });
        nodes.push({ id: `${side}-bn${i}b`, key: group[i + 1].key, x: q[0], y: q[1], tone, blink: rand() * 2, speed: 0.8 + rand() });
      }
    }
  }

  // vertical buses up to the wheel and down to the trust layer
  for (const a of anchors.filter((x) => x.side === 'up' || x.side === 'down')) {
    const rand = rng(a.key);
    const dir = a.side === 'up' ? -1 : 1;
    const count = 7;
    for (let s = 0; s < count; s++) {
      const off = (s - (count - 1) / 2) * 6;
      const x0 = cx + off;
      const y0 = cy + dir * Math.sqrt(Math.max(0, r * r - off * off));
      const full = s === 3 || rand() < 0.5;
      const yEnd = full ? a.y : y0 + (a.y - y0) * (0.35 + rand() * 0.4);
      const xEnd = a.x + off * (full ? 0.5 : 0.8);
      const mid = (y0 + yEnd) / 2;
      const tone: Tone = s === 3 ? 'orange' : a.tone === 'orange' && s % 2 ? 'orange' : 'blue';
      lines.push({ id: `${a.key}-v${s}`, key: a.key, tone, kind: full ? 'main' : 'filler', grow: Math.abs(s - 3) * 0.12, d: `M${f(x0)},${f(y0)} C${f(x0)},${f(mid)} ${f(xEnd)},${f(mid)} ${f(xEnd)},${f(yEnd)}`, flicker: rand() < 0.3 ? 1 + rand() * 2 : undefined });
      if (!full) nodes.push({ id: `${a.key}-vn${s}`, key: a.key, x: xEnd, y: yEnd, tone, blink: rand() * 3, speed: 1 + rand() * 1.5 });
    }
  }
  return { lines, nodes };
}

export function FlowLines({ root, hot, zoom = 1 }: { root: RefObject<HTMLElement>; hot: string | null; zoom?: number }) {
  const [scene, setScene] = useState<Scene | null>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const base = el.getBoundingClientRect();
      const core = el.querySelector<HTMLElement>('[data-hub]');
      // only in the three-column layout; on phones it stacks and the roots would have nowhere to go
      const cols = getComputedStyle(el).gridTemplateColumns.split(' ').length;
      if (!core || core.offsetParent === null || cols !== 3) {
        setScene(null);
        return;
      }
      // when the section is zoomed to fit, client rects are in screen px but the SVG draws in layout px
      const z = base.width / el.offsetWidth || 1;
      const c = core.getBoundingClientRect();
      const cx = (c.left + c.width / 2 - base.left) / z;
      const cy = (c.top + c.height / 2 - base.top) / z;
      const r = c.width / 2 / z;
      const anchors: Anchor[] = [];
      el.querySelectorAll<HTMLElement>('[data-flow]').forEach((a, n) => {
        const side = a.dataset.flow as Side;
        const ar = a.getBoundingClientRect();
        anchors.push({
          side,
          tone: (a.dataset.tone as Tone) || 'blue',
          key: a.dataset.key || String(n),
          x: ((side === 'left' ? ar.right : side === 'right' ? ar.left : ar.left + ar.width / 2) - base.left) / z,
          y: ((side === 'up' ? ar.bottom : side === 'down' ? ar.top : ar.top + ar.height / 2) - base.top) / z,
        });
      });
      setScene({ w: el.offsetWidth, h: el.offsetHeight, cx, cy, r, ...build(anchors, cx, cy, r) });
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
  }, [root, zoom]);

  if (!scene) return null;
  const { w, h, cx, cy, r, lines, nodes } = scene;
  const mains = lines.filter((l) => l.kind === 'main');
  const isHot = (k: string) => (hot === k ? 'is-hot' : '');

  return (
    <svg className="flows" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <filter id="flow-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* broken arcs circling the hub, turning slowly in opposite directions */}
      <g className="flows__arcs">
        {[1.62, 1.76, 1.92].map((k, i) => (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={r * k}
            className={`arc arc--${i}`}
            style={{ transformOrigin: `${cx}px ${cy}px` } as CSSProperties}
          />
        ))}
      </g>

      {/* the faint permanent structure; some strands flicker */}
      <g className="flows__base">
        {lines.map((l) => (
          <path
            key={l.id}
            id={`flow-${l.id}`}
            d={l.d}
            className={`flow flow--${l.tone} flow--${l.kind} ${l.flicker ? 'is-flicker' : ''} ${isHot(l.key)}`}
            style={l.flicker ? ({ animationDuration: `${l.flicker}s` } as CSSProperties) : undefined}
          />
        ))}
      </g>

      {/* the roots: bright light that grows out from the hub along every strand, holds, fades, and grows again */}
      <g className="flows__grow" filter="url(#flow-glow)">
        {lines.map((l) => (
          <path key={l.id} d={l.d} pathLength={100} className={`grow grow--${l.tone} grow--${l.kind} ${isHot(l.key)}`} style={{ animationDelay: `${l.grow}s` }} />
        ))}
      </g>

      {/* short bright pulses running along the main strands */}
      <g className="flows__pulse">
        {mains.map((l, i) => (
          <path key={l.id} d={l.d} pathLength={100} className={`pulse pulse--${l.tone} ${isHot(l.key)}`} style={{ animationDelay: `${-((i * 0.53) % 3.6)}s` }} />
        ))}
      </g>

      {/* blinking nodes at the tips of roots, fillers and bridges */}
      <g className="flows__nodes">
        {nodes.map((n) => (
          <circle
            key={n.id}
            cx={n.x}
            cy={n.y}
            r={hot === n.key ? 3 : 2}
            className={`node node--${n.tone} ${isHot(n.key)}`}
            style={{ animationDelay: `${-n.blink}s`, animationDuration: `${n.speed}s` }}
          />
        ))}
      </g>

      {/* packets riding the main strands: sources stream into the hub, the hub streams out to uses */}
      <g className="flows__packets">
        {mains.map((l, i) => (
          <circle key={l.id} r={hot === l.key ? 3.2 : 2} className={`packet packet--${l.tone}`}>
            <animateMotion dur={`${3 + (i % 5) * 0.55}s`} begin={`${-((i * 0.71) % 3)}s`} repeatCount="indefinite" keyPoints={l.tone === 'blue' ? '1;0' : '0;1'} keyTimes="0;1" calcMode="linear">
              <mpath href={`#flow-${l.id}`} />
            </animateMotion>
          </circle>
        ))}
      </g>
    </svg>
  );
}
