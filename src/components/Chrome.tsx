import { useEffect, useState } from 'react';
import type { Resume } from '../lib/types';
import { Icon } from './Icon';
import { Logo } from './Logo';

export const NAV = [
  { id: 'overview', label: 'Overview' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'outcomes', label: 'Outcomes' },
  { id: 'contact', label: 'Contact' },
];

export function TopBar({ resume, active }: { resume: Resume; active: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 10);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className={`top ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="wrap top__inner">
        <a className="top__brand" href="#overview">
          <Logo size={34} />
          <span className="wordmark">{resume.name}</span>
        </a>
        <nav className={`top__links ${open ? 'is-open' : ''}`} aria-label="Sections">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'is-active' : ''} aria-current={active === n.id ? 'location' : undefined} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="top__end">
          <a className="pill pill--sm pill--warm" href={resume.email ? `mailto:${resume.email}` : '#contact'}>
            <Icon name="mail" size={15} /> Contact
          </a>
          <button className="icon-btn top__burger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? 'close' : 'menu'} size={17} />
          </button>
        </div>
      </div>
    </header>
  );
}

export function Footer({ resume }: { resume: Resume }) {
  const links = [
    resume.email && { icon: 'mail' as const, label: resume.email, href: `mailto:${resume.email}` },
    resume.phone && { icon: 'phone' as const, label: resume.phone, href: `tel:${resume.phone.replace(/[^\d+]/g, '')}` },
    resume.location && { icon: 'pin' as const, label: resume.location },
    resume.links.linkedin && { icon: 'linkedin' as const, label: 'LinkedIn', href: resume.links.linkedin.startsWith('http') ? resume.links.linkedin : `https://${resume.links.linkedin}` },
    resume.links.github && { icon: 'github' as const, label: 'GitHub', href: resume.links.github.startsWith('http') ? resume.links.github : `https://${resume.links.github}` },
  ].filter(Boolean) as { icon: 'mail' | 'phone' | 'pin' | 'linkedin' | 'github'; label: string; href?: string }[];

  return (
    <footer className="foot" id="contact">
      <div className="wrap foot__inner">
        <div className="foot__brand">
          <Logo size={30} />
          <div>
            <p className="wordmark">{resume.name}</p>
            <small>{resume.headline}</small>
          </div>
        </div>
        <ul className="foot__links">
          {links.map((l) => (
            <li key={l.label}>
              {l.href ? (
                <a href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                  <Icon name={l.icon} size={15} /> {l.label}
                </a>
              ) : (
                <span>
                  <Icon name={l.icon} size={15} /> {l.label}
                </span>
              )}
            </li>
          ))}
        </ul>
        {resume.cvUrl && (
          <div className="foot__actions">
            <a className="pill pill--ghost pill--sm" href={resume.cvUrl} download>
              <Icon name="download" size={15} /> Download CV
            </a>
          </div>
        )}
      </div>
    </footer>
  );
}
