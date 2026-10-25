import { useEffect, useState, type CSSProperties } from 'react';
import worldMap from '../assets/photos/world-map.jpg';
import { useInView } from '../hooks/useInView';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { iconFor } from '../lib/security';
import type { Resume } from '../lib/types';
import { GlowCard } from './GlowCard';
import { Icon, type IconName } from './Icon';

/* ================= key outcomes ================= */

const OUTCOME_ICONS: IconName[] = ['shieldCheck', 'chart', 'rocket', 'trophy', 'award'];

function Outcomes({ resume }: { resume: Resume }) {
  const items = resume.achievements.slice(0, 5);
  return (
    <GlowCard className="outcomes" accent="amber" speed={8} phase={0.3} tilt={false} id="outcomes">
      <p className="label">Key Outcomes</p>
      {items.length ? (
        <ul>
          {items.map((a, i) => (
            <li key={a + i} style={{ '--i': i } as CSSProperties}>
              <span className="outcomes__icon">
                <Icon name={OUTCOME_ICONS[i % OUTCOME_ICONS.length]} size={18} />
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Add an Achievements section to your CV to list outcomes here.</p>
      )}
    </GlowCard>
  );
}

/* ================= world map ================= */

// rough positions on the map photo (fractions of width / height) — enough to drop a pin near home
const PLACES: [RegExp, number, number][] = [
  [/seattle|portland|vancouver|san francisco|los angeles|california|oregon|washington state/i, 0.115, 0.34],
  [/new york|boston|toronto|chicago|washington|atlanta|miami|canada|usa|united states|america/i, 0.2, 0.33],
  [/mexico/i, 0.17, 0.47],
  [/brazil|são paulo|sao paulo|rio|argentina|chile|peru|colombia/i, 0.31, 0.68],
  [/london|uk|united kingdom|ireland|dublin|england|scotland/i, 0.465, 0.255],
  [/paris|france|germany|berlin|amsterdam|netherlands|spain|madrid|italy|europe|poland|sweden/i, 0.5, 0.29],
  [/dubai|uae|abu dhabi|saudi|qatar|doha|riyadh/i, 0.6, 0.44],
  [/nigeria|lagos|kenya|nairobi|ghana|egypt|cairo/i, 0.53, 0.55],
  [/south africa|cape town|johannesburg/i, 0.54, 0.8],
  [/india|bengaluru|bangalore|mumbai|delhi|hyderabad|chennai|pune|kolkata/i, 0.665, 0.47],
  [/singapore|malaysia|kuala lumpur|indonesia|jakarta/i, 0.755, 0.6],
  [/china|beijing|shanghai|hong kong|taiwan/i, 0.78, 0.38],
  [/japan|tokyo|korea|seoul/i, 0.85, 0.36],
  [/australia|sydney|melbourne|new zealand|auckland/i, 0.87, 0.8],
];
const HUBS: [number, number][] = [
  [0.2, 0.33],
  [0.49, 0.28],
  [0.665, 0.47],
  [0.78, 0.38],
  [0.31, 0.68],
  [0.87, 0.8],
];

function MapPanel({ resume }: { resume: Resume }) {
  const home = PLACES.find(([re]) => re.test(resume.location ?? ''));
  const [hx, hy] = home ? [home[1], home[2]] : [0.49, 0.32];
  const [ref, inView] = useInView<HTMLDivElement>(0.25);
  const W = 1400;
  const H = 648;
  const arc = (x: number, y: number) => {
    const x0 = hx * W;
    const y0 = hy * H;
    const x1 = x * W;
    const y1 = y * H;
    const lift = Math.hypot(x1 - x0, y1 - y0) * 0.35;
    return `M${x0},${y0} Q${(x0 + x1) / 2},${Math.min(y0, y1) - lift} ${x1},${y1}`;
  };
  const motto = (resume.motto || 'Secure. Resilient. Trusted.').toUpperCase();
  return (
    <GlowCard className="mapcard" accent="blue" speed={11} phase={0.6} tilt={false}>
      <p className="label mapcard__title">{motto}</p>
      <div ref={ref} className={`map ${inView ? 'is-in' : ''}`}>
        <img src={worldMap} alt="" loading="lazy" />
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
          {HUBS.filter(([x, y]) => Math.hypot(x - hx, y - hy) > 0.05).map(([x, y], i) => (
            <g key={i}>
              <path d={arc(x, y)} pathLength={100} className="map__arc" style={{ animationDelay: `${i * 0.5}s` }} />
              <circle cx={x * W} cy={y * H} r={7} className="map__node" style={{ animationDelay: `${i * 0.4}s` }} />
            </g>
          ))}
        </svg>
        <span className="map__pin" style={{ left: `${hx * 100}%`, top: `${hy * 100}%` }}>
          <i />
          <em>{resume.location || 'Your location'}</em>
        </span>
      </div>
    </GlowCard>
  );
}

/* ================= interests & goals orbit ================= */

function Orbit({ resume }: { resume: Resume }) {
  const items = [
    ...resume.interests.map((t) => ({ t, kind: 'Interest' })),
    ...resume.goals.map((g) => ({ t: g.value, kind: g.label || 'Goal' })),
  ].slice(0, 8);
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // walks around the ring on its own; hovering an item takes over
  useEffect(() => {
    if (reduced || paused || items.length < 2) return;
    const t = window.setInterval(() => setActive((a) => (a + 1) % items.length), 2400);
    return () => clearInterval(t);
  }, [reduced, paused, items.length]);

  const cur = items[active];
  return (
    <GlowCard className="orbitcard" accent="blue" speed={9} phase={0.9} tilt={false}>
      <p className="label">Interests &amp; Goals</p>
      <div className="orbit" onPointerLeave={() => setPaused(false)}>
        <span className="orbit__track" aria-hidden />
        <span className="orbit__track orbit__track--inner" aria-hidden />
        {items.map((it, i) => {
          const a = -90 + (360 / items.length) * i;
          const x = 50 + 41 * Math.cos((a * Math.PI) / 180);
          const y = 50 + 41 * Math.sin((a * Math.PI) / 180);
          return (
            <button
              key={it.t + i}
              className={`orbit__node ${i === active ? 'is-on' : ''} ${it.kind === 'Interest' ? '' : 'is-goal'}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              onPointerEnter={() => {
                setPaused(true);
                setActive(i);
              }}
              onFocus={() => {
                setPaused(true);
                setActive(i);
              }}
              aria-label={`${it.kind}: ${it.t}`}
            >
              <Icon name={it.kind === 'Interest' ? iconFor(it.t, i) : 'target'} size={16} />
            </button>
          );
        })}
        <span className="orbit__person" aria-hidden>
          <Icon name="user" size={40} />
        </span>
      </div>
      <p className="orbit__caption" aria-live="polite">
        {cur ? (
          <>
            <small>{cur.kind}</small>
            {cur.t}
          </>
        ) : (
          'Add interests or goals to your CV'
        )}
      </p>
    </GlowCard>
  );
}

export function BottomRow({ resume }: { resume: Resume }) {
  return (
    <section className="bottom wrap" aria-label="Outcomes, reach and interests">
      <Outcomes resume={resume} />
      <MapPanel resume={resume} />
      <Orbit resume={resume} />
    </section>
  );
}
