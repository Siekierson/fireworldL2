'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import RightSidebar from './RightSidebar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-800 to-red-900 relative">
      <div className="absolute inset-0 bg-[url('/bgPattern.png')] opacity-10 pointer-events-none"></div>
      {!isLoginPage && <Sidebar />}
      <main className={`relative z-10 ${!isLoginPage ? 'lg:pl-64 xl:pl-72 lg:pr-72 xl:pr-80' : ''}`}>
        <div className="w-full flex justify-center">
          <div className="max-w-4xl w-full px-4 py-8">
            {children}
          </div>
        </div>
      </main>
      {!isLoginPage && (
        <div className="hidden lg:block relative z-10">
          <RightSidebar />
        </div>
      )}
    </div>
  );
} 