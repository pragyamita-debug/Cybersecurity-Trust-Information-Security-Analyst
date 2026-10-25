import { useScrollSpy } from '../hooks/useScrollSpy';
import type { StoredProfile } from '../lib/types';
import { BottomRow } from './BottomRow';
import { Footer, NAV, TopBar } from './Chrome';
import { Ecosystem } from './Ecosystem';
import './Dashboard.css';

const IDS = NAV.map((n) => n.id);

interface Props {
  profile: StoredProfile;
  isExample: boolean;
  onUploadNew: () => void;
  onEdit: () => void;
  onReset: () => void;
  onDownloadCv: () => void;
}

export function Dashboard({ profile, isExample, onUploadNew, onEdit, onReset, onDownloadCv }: Props) {
  const { resume } = profile;
  const active = useScrollSpy(IDS, 140);
  return (
    <>
      <span className="space" aria-hidden />
      <TopBar resume={resume} active={active} isExample={isExample} onUpload={onUploadNew} />
      <main>
        <Ecosystem resume={resume} isExample={isExample} onUpload={onUploadNew} />
        <BottomRow resume={resume} />
      </main>
      <Footer resume={resume} isExample={isExample} onUpload={onUploadNew} onEdit={onEdit} onReset={onReset} onDownloadCv={onDownloadCv} />
    </>
  );
}
