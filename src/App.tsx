import { useHouse } from './store/store';
import { Onboarding } from './screens/Onboarding';
import { Today } from './screens/Today';
import { Week } from './screens/Week';
import { Dinner } from './screens/Dinner';
import { Groceries } from './screens/Groceries';
import { SheetHost } from './screens/Sheets';
import { TabBar, Toast } from './ui/components';

export function App() {
  const { state, tab } = useHouse();
  if (!state.onboarded || state.members.length < 2) return <div className="shell"><Onboarding /></div>;
  return (
    <div className="shell">
      <main className="view">
        {tab === 'today' && <Today />}
        {tab === 'week' && <Week />}
        {tab === 'dinner' && <Dinner />}
        {tab === 'groceries' && <Groceries />}
      </main>
      <TabBar />
      <SheetHost />
      <Toast />
    </div>
  );
}
