import { useScrollSpy } from '../hooks/useScrollSpy';
import type { Resume } from '../lib/types';
import { BottomRow } from './BottomRow';
import { Footer, NAV, TopBar } from './Chrome';
import { Ecosystem } from './Ecosystem';
import './Dashboard.css';

const IDS = NAV.map((n) => n.id);

export function Dashboard({ resume }: { resume: Resume }) {
  const active = useScrollSpy(IDS, 140);
  return (
    <>
      <span className="space" aria-hidden />
      <TopBar resume={resume} active={active} />
      <main>
        <Ecosystem resume={resume} />
        <BottomRow resume={resume} />
      </main>
      <Footer resume={resume} />
    </>
  );
}
