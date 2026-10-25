import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { useCountUp } from '../hooks/useCountUp';
import { useInView } from '../hooks/useInView';
import { useFitZoom } from '../hooks/useFitZoom';
import { useScramble } from '../hooks/useScramble';
import { describeSkill, iconFor, shortCert, twoLines } from '../lib/security';
import type { Resume } from '../lib/types';
import { FlowLines } from './FlowLines';
import { GlowCard } from './GlowCard';
import { Icon, type IconName } from './Icon';

export function splitHeadline(headline: string): [string, string] {
  const [role, ...rest] = headline.split(/\s*[|·•]\s*|\s+[—–]\s+/);
  return [role?.trim() || headline, rest.join(' · ').trim()];
}

const firstSentence = (s: string) => (s.match(/^.+?[.!?](\s|$)/)?.[0] ?? s).trim();

/* ================= intro (top-left title block) ================= */

function Intro({ resume }: { resume: Resume }) {
  const [role, focus] = splitHeadline(resume.headline);
  const [a, b] = twoLines(role.toUpperCase());
  const [ref, inView] = useInView<HTMLDivElement>(0.2);
  const l1 = useScramble(a, inView, { duration: 900 });
  const l2 = useScramble(b, inView, { duration: 1100, delay: 250 });
  return (
    <div className="intro" ref={ref}>
      {focus && <p className="intro__tag">{focus}</p>}
      <h1 className="intro__title" aria-label={role}>
        <span aria-hidden>{l1 || ' '}</span>
        {b && <span aria-hidden>{l2 || ' '}</span>}
      </h1>
      <p className="intro__lede">{resume.tagline || firstSentence(resume.summary)}</p>
      <span className="intro__rule" aria-hidden />
      <div className="intro__actions">
        <a className="pill pill--sm" href={resume.email ? `mailto:${resume.email}` : '#contact'}>
          <Icon name="mail" size={15} /> Get in touch
        </a>
        <a className="text-link" href="#outcomes">
          See outcomes <Icon name="arrowRight" size={15} />
        </a>
      </div>
    </div>
  );
}

/* ================= pillars (left list, amber titles) ================= */

function Pillars({ resume, onHot }: { resume: Resume; onHot: (k: string | null) => void }) {
  const items = resume.skills.slice(0, 5);
  return (
    <ul className="pillars" id="expertise" aria-label="Core expertise">
      {items.map((s, i) => (
        <li
          key={s + i}
          className="pillar"
          style={{ '--i': i } as CSSProperties}
          data-flow="left"
          data-tone="blue"
          data-key={`pillar-${i}`}
          onPointerEnter={() => onHot(`pillar-${i}`)}
          onPointerLeave={() => onHot(null)}
        >
          <span className="pillar__icon">
            <Icon name={iconFor(s, i)} size={22} />
          </span>
          <span className="pillar__text">
            <b>{s}</b>
            <small>{describeSkill(s, resume, i)}</small>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ================= list panels (data sources / uses / participants) ================= */

interface Row {
  key: string;
  icon: IconName;
  label: string;
  sub?: string;
}

function ListPanel({
  id,
  title,
  rows,
  side,
  tone,
  accent,
  phase,
  onHot,
}: {
  id?: string;
  title: string;
  rows: Row[];
  side: 'left' | 'right';
  tone: 'blue' | 'orange';
  accent: 'blue' | 'amber';
  phase: number;
  onHot: (k: string | null) => void;
}) {
  return (
    <GlowCard id={id} className={`panel panel--${side} panel--${tone}`} accent={accent} speed={9} phase={phase} tilt={false}>
      <p className="label panel__title">{title}</p>
      <ul className="rows">
        {rows.map((r, i) => (
          <li key={r.key} className="row" style={{ '--i': i } as CSSProperties} onPointerEnter={() => onHot(r.key)} onPointerLeave={() => onHot(null)}>
            {side === 'right' && <span className="row__dot" data-flow="right" data-tone={tone} data-key={r.key} />}
            <span className="row__icon">
              <Icon name={r.icon} size={side === 'right' ? 19 : 17} />
            </span>
            <span className="row__text">
              <b title={r.label}>{r.label}</b>
              {r.sub && <small>{r.sub}</small>}
            </span>
            {side === 'left' && <span className="row__dot" data-flow="left" data-tone={tone} data-key={r.key} />}
          </li>
        ))}
      </ul>
    </GlowCard>
  );
}

/* ================= governance wheel (top, certifications) ================= */

const WHEEL = 340;
const C = WHEEL / 2;
const polar = (r: number, deg: number) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)] as const;
function wedge(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M${x0},${y0} A${r1},${r1} 0 0 1 ${x1},${y1} L${x2},${y2} A${r0},${r0} 0 0 0 ${x3},${y3} Z`;
}

function Wheel({ resume }: { resume: Resume }) {
  const [hover, setHover] = useState<number | null>(null);
  // five slots: certifications first, then interests, so the wheel is always complete
  const items = [...resume.certifications, ...resume.interests].slice(0, 5);
  const n = items.length || 1;
  const step = 360 / n;
  const icons: IconName[] = ['shieldCheck', 'search', 'users', 'policy', 'scale'];

  return (
    <div className="wheel" data-flow="up" data-tone="blue" data-key="wheel">
      <svg viewBox={`0 0 ${WHEEL} ${WHEEL}`} className="wheel__svg" aria-hidden>
        <defs>
          <path id="wheel-arc" d={`M ${C - 152},${C} A 152 152 0 0 1 ${C + 152},${C}`} />
          <radialGradient id="wedge-hot">
            <stop offset="0.4" stopColor="rgba(61,155,255,0)" />
            <stop offset="1" stopColor="rgba(61,155,255,0.32)" />
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={164} className="wheel__outer" />
        <circle cx={C} cy={C} r={140} className="wheel__track" />
        <text className="wheel__caption">
          <textPath href="#wheel-arc" startOffset="50%" textAnchor="middle">
            {items.length && resume.certifications.length ? 'CERTIFIED TRUST FRAMEWORK' : 'TRUST FRAMEWORK'}
          </textPath>
        </text>
        {items.map((_, i) => {
          const a0 = -90 - step / 2 + i * step;
          return <path key={i} d={wedge(64, 140, a0, a0 + step)} className={`wheel__wedge ${hover === i ? 'is-hot' : ''}`} />;
        })}
        {items.map((_, i) => {
          const a = -90 - step / 2 + i * step;
          const [x0, y0] = polar(64, a);
          const [x1, y1] = polar(140, a);
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} className="wheel__spoke" />;
        })}
        {/* the nodes where the spokes meet the inner ring glow amber, like the design */}
        {items.map((_, i) => {
          const [x, y] = polar(64, -90 - step / 2 + i * step);
          return <circle key={i} cx={x} cy={y} r={2.6} className="wheel__node" />;
        })}
        <circle cx={C} cy={C} r={58} className="wheel__core" />
        <circle cx={C} cy={C} r={164} className="wheel__run" pathLength={100} />
      </svg>

      {items.map((t, i) => {
        const [x, y] = polar(103, -90 + i * step);
        const [l1, l2] = twoLines(shortCert(t).toUpperCase());
        return (
          <button
            key={t + i}
            className={`wheel__item ${hover === i ? 'is-hot' : ''}`}
            style={{ left: `${(x / WHEEL) * 100}%`, top: `${(y / WHEEL) * 100}%`, '--i': i } as CSSProperties}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            title={t}
          >
            <Icon name={icons[i % icons.length]} size={22} />
            <span>
              {l1}
              {l2 && <br />}
              {l2}
            </span>
          </button>
        );
      })}

      <div className="wheel__center">
        <Icon name="fingerprint" size={30} />
        <span>
          TRUST
          <br />
          AT THE CENTER
        </span>
      </div>
    </div>
  );
}

/* ================= hub (centre) with the rising sun ================= */

function Hub({ resume }: { resume: Resume }) {
  const [role] = splitHeadline(resume.headline);
  const words = resume.name.toUpperCase().split(/\s+/).filter(Boolean);
  const lines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : words;
  // condensed caps are ~0.5em wide; shrink long names so the longest line fits the core
  const longest = Math.max(4, ...lines.map((l) => l.length));
  const fit = Math.min(40, Math.floor(250 / (longest * 0.52)));
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const years = useCountUp(resume.stats.years, inView, { duration: 2200, delay: 900 });
  return (
    <div className="hub" ref={ref}>
      <span className="hub__ring hub__ring--1" aria-hidden />
      <span className="hub__ring hub__ring--2" aria-hidden />
      <span className="hub__ring hub__ring--3" aria-hidden />
      <span className="hub__ticks" aria-hidden />
      <div className="hub__core" data-hub>
        <span className="hub__grid" aria-hidden />
        {/* a sun rising over the curve of the earth, behind the name */}
        <span className="hub__sun" aria-hidden />
        <span className="hub__earth" aria-hidden />
        <div className="hub__text">
          <p className="hub__name" style={{ fontSize: `${fit}px` }}>
            {lines.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </p>
          <p className="hub__role">{role}</p>
          <p className="hub__years">
            <b>
              {String(Math.round(years)).padStart(2, '0')}
              {resume.stats.yearsPlus ? '+' : ''}
            </b>
            <small>Years securing systems</small>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= trust layer (bottom ellipse, counting stats) ================= */

function Stat({ value, plus, label, icon, run, delay, pos }: { value: number; plus?: boolean; label: string; icon: IconName; run: boolean; delay: number; pos: string }) {
  const v = useCountUp(value, run, { duration: 1800, delay });
  const [l1, l2] = twoLines(label.toUpperCase());
  return (
    <div className={`trust__item trust__item--${pos}`}>
      <span className="trust__icon">
        <Icon name={icon} size={17} />
      </span>
      <b>
        {Math.round(v)}
        {plus ? '+' : ''}
      </b>
      <small>
        {l1}
        <br />
        {l2}
      </small>
    </div>
  );
}

function TrustLayer({ resume }: { resume: Resume }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const s = resume.stats;
  return (
    <div className="trust" ref={ref} data-flow="down" data-tone="orange" data-key="trust">
      <svg className="trust__svg" viewBox="0 0 460 250" preserveAspectRatio="none" aria-hidden>
        <ellipse cx="230" cy="128" rx="226" ry="118" className="trust__ring" />
        <ellipse cx="230" cy="128" rx="226" ry="118" className="trust__run" pathLength={100} />
      </svg>
      <p className="label trust__title">Trust &amp; Track Record</p>
      <Stat pos="tl" icon="clock" value={s.years} plus={s.yearsPlus} label="Years experience" run={inView} delay={200} />
      <Stat pos="tr" icon="award" value={resume.certifications.length} label="Certifications held" run={inView} delay={350} />
      <div className="trust__lock">
        <Icon name="lock" size={30} />
      </div>
      <Stat pos="ml" icon="briefcase" value={resume.experience.length} label="Security roles" run={inView} delay={500} />
      <Stat pos="mr" icon="folder" value={resume.projects.length} plus={s.projectsPlus} label="Projects delivered" run={inView} delay={650} />
      <Stat pos="bc" icon="skills" value={resume.skills.length} label="Skills & tools" run={inView} delay={800} />
    </div>
  );
}

/* ================= career flow chart (top-right) ================= */

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t * 1664525 + 1013904223) % 4294967296;
    return t / 4294967296;
  };
}

function CareerFlow({ resume }: { resume: Resume }) {
  const [ref, inView] = useInView<HTMLDivElement>(0.3);
  const years = useCountUp(resume.stats.years, inView, { duration: 2000, delay: 300 });
  const projects = useCountUp(resume.projects.length, inView, { duration: 2000, delay: 500 });
  // the strands are seeded from the CV so each candidate gets their own, stable shape
  const lines = useMemo(() => {
    const seed = [...resume.name].reduce((a, ch) => a + ch.charCodeAt(0), 0) + resume.stats.years * 31;
    const r = rng(seed);
    const make = (n: number, tone: 'blue' | 'orange', lift: number) =>
      Array.from({ length: n }, (_, i) => {
        const amp = 10 + r() * 22;
        const f = 1.6 + r() * 2.4;
        const ph = r() * Math.PI * 2;
        const y0 = 170 - i * 3 - lift;
        const y1 = 40 + r() * 50 - lift * 0.5;
        const pts: string[] = [];
        for (let x = 0; x <= 300; x += 10) {
          const t = x / 300;
          const y = y0 + (y1 - y0) * t * t + Math.sin(t * f * Math.PI + ph) * amp * (0.35 + t * 0.65);
          pts.push(`${x},${y.toFixed(1)}`);
        }
        return { tone, d: `M${pts.join(' L')}`, delay: i * 0.18 + (tone === 'orange' ? 0.4 : 0) };
      });
    return [...make(6, 'blue', 0), ...make(5, 'orange', 18)];
  }, [resume.name, resume.stats.years]);

  return (
    <GlowCard className="cflow" accent="blue" speed={10} phase={0.2} tilt={false}>
      <div ref={ref} className={`cflow__inner ${inView ? 'is-in' : ''}`}>
        <p className="label">Career Flow</p>
        <ul className="cflow__legend">
          <li className="is-blue">Experience</li>
          <li className="is-orange">Projects &amp; impact</li>
        </ul>
        <svg className="cflow__svg" viewBox="0 0 300 200" preserveAspectRatio="none" aria-hidden>
          {lines.map((l, i) => (
            <path key={i} d={l.d} pathLength={100} className={`cflow__line cflow__line--${l.tone}`} style={{ animationDelay: `${l.delay}s` }} />
          ))}
        </svg>
        <div className="cflow__kpis">
          <p>
            <b>
              {Math.round(years)}
              {resume.stats.yearsPlus ? '+' : ''}
            </b>
            <small>Years</small>
          </p>
          <p className="is-orange">
            <b>{Math.round(projects)}</b>
            <small>Projects</small>
          </p>
        </div>
      </div>
      <span data-flow="right" data-tone="orange" data-key="flows" className="cflow__anchor" />
    </GlowCard>
  );
}

/* ================= the whole ecosystem ================= */

export function Ecosystem({ resume }: { resume: Resume }) {
  const root = useRef<HTMLElement>(null);
  const [hot, setHot] = useState<string | null>(null);
  const zoom = useFitZoom();

  const tools: Row[] = resume.skills.slice(5, 12).map((s, i) => ({ key: `tool-${i}`, icon: iconFor(s, i + 3), label: s }));
  const roles: Row[] = resume.experience.slice(0, 5).map((e, i) => ({
    key: `role-${i}`,
    icon: (['shieldCheck', 'radar', 'eye', 'network', 'server'] as IconName[])[i],
    label: e.role,
    sub: [e.company, e.period].filter(Boolean).join(' · '),
  }));
  const projects: Row[] = resume.projects.slice(0, 6).map((p, i) => ({
    key: `project-${i}`,
    icon: iconFor(`${p.title} ${p.tags.join(' ')} ${p.description}`, i),
    label: p.title,
  }));

  return (
    <section className="eco wrap" id="overview" ref={root} aria-label="Profile overview" style={zoom !== 1 ? ({ zoom } as CSSProperties) : undefined}>
      <FlowLines root={root} hot={hot} zoom={zoom} />

      <div className="eco__col eco__col--left">
        <Intro resume={resume} />
        <Pillars resume={resume} onHot={setHot} />
        {tools.length > 0 && <ListPanel title="Toolkit" rows={tools} side="left" tone="blue" accent="blue" phase={0.5} onHot={setHot} />}
      </div>

      <div className="eco__col eco__col--mid">
        <Wheel resume={resume} />
        <Hub resume={resume} />
        <TrustLayer resume={resume} />
      </div>

      <div className="eco__col eco__col--right">
        <CareerFlow resume={resume} />
        {roles.length > 0 && <ListPanel id="experience" title="Experience" rows={roles} side="right" tone="orange" accent="amber" phase={0.1} onHot={setHot} />}
        {projects.length > 0 && <ListPanel id="projects" title="Projects & Engagements" rows={projects} side="right" tone="orange" accent="amber" phase={0.7} onHot={setHot} />}
      </div>
    </section>
  );
}
