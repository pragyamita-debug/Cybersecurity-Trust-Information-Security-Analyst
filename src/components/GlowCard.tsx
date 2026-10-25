import type { CSSProperties, ElementType, ReactNode } from 'react';
import { usePointerGlow } from '../hooks/usePointerGlow';
import './GlowCard.css';

export type Accent = 'blue' | 'green' | 'purple' | 'teal' | 'amber';

interface Props {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  accent?: Accent;
  /** seconds for one lap of the border light */
  speed?: number;
  /** offset so neighbouring cards don't light up in sync (0–1 of a lap) */
  phase?: number;
  tilt?: boolean;
  active?: boolean;
  id?: string;
  style?: CSSProperties;
  [key: string]: unknown;
}

/**
 * Card with a light that travels around its border (conic gradient + mask),
 * a blurred halo copy of that light, and a pointer-follow spotlight / tilt on hover.
 */
export function GlowCard({
  children,
  as: Tag = 'div',
  className = '',
  accent = 'green',
  speed = 7,
  phase = 0,
  tilt = true,
  active = false,
  style,
  ...rest
}: Props) {
  const glow = usePointerGlow<HTMLDivElement>({ tilt: tilt ? 5 : 0 });

  return (
    <Tag
      ref={glow.ref}
      onPointerMove={glow.onPointerMove}
      onPointerLeave={glow.onPointerLeave}
      className={`glow-card glow-card--${accent} ${active ? 'is-active' : ''} ${className}`}
      style={{ '--spin': `${speed}s`, '--phase': `${-phase * speed}s`, ...style } as CSSProperties}
      {...rest}
    >
      <span className="glow-card__halo" aria-hidden>
        <span className="glow-card__ring" />
      </span>
      <span className="glow-card__ring" aria-hidden />
      <span className="glow-card__spot" aria-hidden />
      <div className="glow-card__body">{children}</div>
    </Tag>
  );
}
