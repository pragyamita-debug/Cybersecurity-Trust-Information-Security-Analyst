import { Dashboard } from './components/Dashboard';
import { profile } from './data/profile';

export default function App() {
  return <Dashboard resume={profile} />;
}
