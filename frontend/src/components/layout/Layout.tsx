import { Outlet } from 'react-router-dom';
import { ApiStatusProvider } from '../../context/ApiStatusContext';
import { ErrorBoundary } from '../ErrorBoundary';
import { TopHeader } from './TopHeader';
import { LeftRail } from './LeftRail';
import { MobileNav } from './MobileNav';

export function Layout() {
  return (
    <ApiStatusProvider>
      <div className="min-h-screen bg-graphite-950 flex flex-col overflow-x-hidden">
        <TopHeader />
        <MobileNav />
        <div className="flex flex-1 min-h-0">
          <LeftRail />
          <main className="flex-1 min-w-0 overflow-y-auto workspace">
            <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 py-7 sm:py-8">
              <ErrorBoundary>
                <Outlet />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </ApiStatusProvider>
  );
}
