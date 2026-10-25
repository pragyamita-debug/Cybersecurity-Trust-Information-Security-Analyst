import { useCallback, useState } from 'react';
import { placeholder } from './data/placeholder';
import sampleCv from './data/sample-cv.txt?raw';
import { Dashboard } from './components/Dashboard';
import { ReviewDialog } from './components/ReviewDialog';
import { PROCESS_STEPS, UploadScreen } from './components/UploadScreen';
import { extractText, readAsDataUrl, UnsupportedFileError } from './lib/extractText';
import { parseResume } from './lib/parseResume';
import { clearProfile, loadProfile, saveProfile } from './lib/storage';
import type { Resume, StoredProfile } from './lib/types';

type Stage = 'upload' | 'processing' | 'review' | 'dashboard';

const MAX_STORED_FILE = 2.5 * 1024 * 1024;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function downloadBlob(href: string, name: string) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function App() {
  const [profile, setProfile] = useState<StoredProfile | null>(() => loadProfile());
  // open on the dashboard; before a CV is uploaded it shows the placeholder profile
  const [stage, setStage] = useState<Stage>('dashboard');
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ resume: Resume; file?: StoredProfile['file'] } | null>(null);

  const commit = useCallback((next: StoredProfile) => {
    setProfile(next);
    saveProfile(next);
  }, []);

  /** Runs the pipeline with visible steps; each step waits a beat so the progress reads as progress. */
  const process = useCallback(async (file: File | null) => {
    setError(null);
    setStage('processing');
    try {
      setStep(0);
      const [text] = await Promise.all([file ? extractText(file) : Promise.resolve(sampleCv), wait(650)]);
      setStep(1);
      await wait(450);
      const resume = parseResume(text);
      setStep(2);
      await wait(450);
      const stored =
        file && file.size <= MAX_STORED_FILE ? { name: file.name, type: file.type, dataUrl: await readAsDataUrl(file) } : undefined;
      setStep(3);
      await wait(400);
      setDraft({ resume, file: stored });
      setStage('review');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof UnsupportedFileError
          ? err.message
          : 'Something went wrong while reading that file. Try exporting your CV as a PDF or DOCX and upload it again.',
      );
      setStage('upload');
    }
  }, []);

  const example: StoredProfile = { resume: placeholder, updatedAt: 0 };

  const confirm = (resume: Resume) => {
    commit({ resume, file: draft?.file ?? profile?.file, photo: profile?.photo, updatedAt: Date.now() });
    setDraft(null);
    setStage('dashboard');
    window.scrollTo({ top: 0 });
  };

  const downloadCv = () => {
    if (profile?.file) downloadBlob(profile.file.dataUrl, profile.file.name);
    else downloadBlob(URL.createObjectURL(new Blob([sampleCv], { type: 'text/plain' })), 'sample-cv.txt');
  };

  return (
    <>
      {stage === 'dashboard' || stage === 'review' ? (
        <Dashboard
          profile={profile ?? example}
          isExample={!profile}
          onUploadNew={() => setStage('upload')}
          onEdit={() => {
            const current = profile ?? example;
            setDraft({ resume: current.resume, file: current.file });
            setStage('review');
          }}
          onReset={() => {
            clearProfile();
            setProfile(null);
            setStage('dashboard');
            window.scrollTo({ top: 0 });
          }}
          onDownloadCv={downloadCv}
        />
      ) : (
        <UploadScreen
          busy={stage === 'processing'}
          step={Math.min(step, PROCESS_STEPS.length - 1)}
          error={error}
          onFile={process}
          onSample={() => process(null)}
          onDownloadSample={() => downloadBlob(URL.createObjectURL(new Blob([sampleCv], { type: 'text/plain' })), 'sample-cv.txt')}
          onCancel={() => setStage('dashboard')}
        />
      )}

      {stage === 'review' && draft && (
        <ReviewDialog
          resume={draft.resume}
          fileName={draft.file?.name}
          onConfirm={confirm}
          onCancel={() => {
            setDraft(null);
            setStage('dashboard');
          }}
        />
      )}

    </>
  );
}
