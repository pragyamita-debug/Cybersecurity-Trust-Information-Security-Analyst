import { useEffect, useRef, useState } from 'react';
import type { Resume } from '../lib/types';
import { Icon } from './Icon';
import './ReviewDialog.css';

interface Props {
  resume: Resume;
  fileName?: string;
  onConfirm: (resume: Resume) => void;
  onCancel: () => void;
}

type Field = { key: keyof Resume | 'linkedin' | 'github'; label: string; wide?: boolean; multiline?: boolean };

const FIELDS: Field[] = [
  { key: 'name', label: 'Full name' },
  { key: 'headline', label: 'Headline' },
  { key: 'tagline', label: 'Tagline', wide: true },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'location', label: 'Location' },
  { key: 'linkedin', label: 'LinkedIn URL' },
  { key: 'github', label: 'GitHub URL' },
  { key: 'motto', label: 'Quote / motto' },
  { key: 'summary', label: 'About me', wide: true, multiline: true },
];

/**
 * Parsing a CV is heuristic, so we always show what we found and let the
 * designer correct it before the dashboard is generated.
 */
export function ReviewDialog({ resume, fileName, onConfirm, onCancel }: Props) {
  const [draft, setDraft] = useState(resume);
  const [skills, setSkills] = useState(resume.skills.join(', '));
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (d && !d.open) d.showModal();
  }, []);

  const value = (key: Field['key']) =>
    key === 'linkedin' || key === 'github' ? draft.links[key] ?? '' : ((draft[key as keyof Resume] as string | undefined) ?? '');

  const update = (key: Field['key'], v: string) =>
    setDraft((d) => (key === 'linkedin' || key === 'github' ? { ...d, links: { ...d.links, [key]: v || undefined } } : { ...d, [key]: v }));

  const submit = () => {
    const list = skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    onConfirm({ ...draft, skills: list, stats: { ...draft.stats, skills: list.length } });
  };

  const found = [
    { n: draft.experience.length, label: 'role', icon: 'briefcase' as const },
    { n: draft.education.length, label: 'degree', icon: 'graduation' as const },
    { n: draft.projects.length, label: 'project', icon: 'folder' as const },
    { n: draft.achievements.length + draft.certifications.length, label: 'achievement', icon: 'star' as const },
  ];

  return (
    <dialog ref={dialog} className="review" onCancel={(e) => (e.preventDefault(), onCancel())} aria-labelledby="review-title">
      <form
        method="dialog"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <header className="review__head">
          <div>
            <span className="label">Step 2 of 2</span>
            <h2 id="review-title">Check what we found</h2>
            <p>
              {fileName ? (
                <>
                  Read from <b>{fileName}</b>.{' '}
                </>
              ) : null}
              Fix anything that looks off — the dashboard updates from these values.
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onCancel} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="review__found">
          {found.map((f) => (
            <span key={f.label} className={`chip ${f.n ? '' : 'is-empty'}`}>
              <Icon name={f.icon} size={14} /> {f.n} {f.label}
              {f.n === 1 ? '' : 's'}
            </span>
          ))}
          <span className="chip">
            <Icon name="clock" size={14} /> {draft.stats.years}
            {draft.stats.yearsPlus ? '+' : ''} yrs experience
          </span>
        </div>

        <div className="review__grid">
          {FIELDS.map((f) => (
            <label key={f.key} className={f.wide ? 'is-wide' : ''}>
              <span>{f.label}</span>
              {f.multiline ? (
                <textarea rows={4} value={value(f.key)} onChange={(e) => update(f.key, e.target.value)} />
              ) : (
                <input value={value(f.key)} onChange={(e) => update(f.key, e.target.value)} />
              )}
            </label>
          ))}
          <label className="is-wide">
            <span>Skills (comma separated)</span>
            <textarea rows={2} value={skills} onChange={(e) => setSkills(e.target.value)} />
          </label>
          <label>
            <span>Years of experience</span>
            <input
              type="number"
              min={0}
              max={60}
              value={draft.stats.years}
              onChange={(e) => setDraft((d) => ({ ...d, stats: { ...d.stats, years: Math.max(0, +e.target.value || 0) } }))}
            />
          </label>
          <label>
            <span>Projects completed</span>
            <input
              type="number"
              min={0}
              max={999}
              value={draft.stats.projects}
              onChange={(e) => setDraft((d) => ({ ...d, stats: { ...d.stats, projects: Math.max(0, +e.target.value || 0) } }))}
            />
          </label>
        </div>

        <footer className="review__foot">
          <button type="button" className="pill pill--ghost pill--sm" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="pill pill--sm">
            Build my dashboard <Icon name="arrowRight" size={16} />
          </button>
        </footer>
      </form>
    </dialog>
  );
}
