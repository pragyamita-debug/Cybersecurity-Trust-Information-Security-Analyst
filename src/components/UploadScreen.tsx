import { useRef, useState, type DragEvent } from 'react';
import { ACCEPTED } from '../lib/extractText';
import { GlowCard } from './GlowCard';
import { Icon } from './Icon';
import heroPhoto from '../assets/photos/world-map.jpg';
import { Logo } from './Logo';
import './UploadScreen.css';

export const PROCESS_STEPS = ['Reading your file', 'Mapping the sections', 'Counting experience & certifications', 'Building your trust dashboard'];

interface Props {
  busy: boolean;
  step: number;
  error: string | null;
  onFile: (file: File) => void;
  onSample: () => void;
  onDownloadSample: () => void;
  onCancel?: () => void;
}

export function UploadScreen({ busy, step, error, onFile, onSample, onDownloadSample, onCancel }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && !busy) onFile(file);
  };

  return (
    <div className="upload">
      <div className="upload__scene" aria-hidden>
        <img src={heroPhoto} alt="" />
      </div>

      <header className="upload__top">
        <span className="upload__brand"><Logo /><span className="wordmark">CV Dashboard</span></span>
        <span className="upload__end">
        {onCancel && !busy && (
          <button className="pill pill--ghost pill--sm" onClick={onCancel}>
            <Icon name="arrowLeft" size={16} /> Back to dashboard
          </button>
        )}
        </span>
      </header>

      <main className="upload__main">
        <div className="upload__copy">
          <span className="label">CV → Dashboard</span>
          <h1>
            Upload a CV.
            <br />
            <span className="accent">Get a secure</span>
            <br />
            <span className="light">trust dashboard.</span>
          </h1>
          <p>
            Candidates drop in a CV and get a cyber-trust dashboard: expertise, tools, roles, projects and outcomes, connected and animated.
            Your file is read here in the browser and never sent to a server.
          </p>
        </div>

        <GlowCard
          className={`upload__drop ${dragging ? 'is-dragging' : ''}`}
          accent={dragging ? 'teal' : 'green'}
          speed={5}
          tilt={false}
          active={dragging || busy}
          onDragOver={(e: DragEvent) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {busy ? (
            <div className="parse" role="status" aria-live="polite">
              <div className="parse__orb" aria-hidden>
                <span />
                <Icon name="shieldCheck" size={26} />
              </div>
              <ol className="parse__steps">
                {PROCESS_STEPS.map((label, i) => (
                  <li key={label} className={i < step ? 'is-done' : i === step ? 'is-active' : ''}>
                    <span className="parse__dot">{i < step ? <Icon name="check" size={13} /> : null}</span>
                    {label}
                  </li>
                ))}
              </ol>
              <div className="parse__bar">
                <span style={{ width: `${((step + 1) / PROCESS_STEPS.length) * 100}%` }} />
              </div>
            </div>
          ) : (
            <div className="drop">
              <div className="drop__icon" aria-hidden>
                <Icon name="upload" size={26} />
              </div>
              <h2>Drag & drop your CV here</h2>
              <p>
                or{' '}
                <button className="drop__browse" onClick={() => input.current?.click()}>
                  browse your files
                </button>
              </p>
              <div className="drop__formats">
                <span className="chip">PDF</span>
                <span className="chip">DOCX</span>
                <span className="chip">TXT</span>
              </div>
              {error && (
                <p className="drop__error" role="alert">
                  {error}
                </p>
              )}
              <input
                ref={input}
                type="file"
                accept={ACCEPTED}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}
        </GlowCard>

        {!busy && (
          <div className="upload__alt">
            <button className="pill" onClick={onSample}>
              Try it with a sample CV <Icon name="arrowRight" size={16} />
            </button>
            <button className="pill pill--ghost pill--sm" onClick={onDownloadSample}>
              <Icon name="download" size={16} /> Download the sample
            </button>
          </div>
        )}

        <ul className="upload__tips">
          <li>
            <Icon name="check" size={14} />
            <span>
              Use clear headings like <b>Experience</b>, <b>Education</b>, <b>Skills</b>, <b>Projects</b>
            </span>
          </li>
          <li>
            <Icon name="check" size={14} />
            <span>Text-based PDFs work best — scanned images can’t be read</span>
          </li>
          <li>
            <Icon name="check" size={14} />
            <span>You can review and fix anything before the dashboard is built</span>
          </li>
        </ul>
      </main>
    </div>
  );
}
