'use client';

import Feed from '@/components/Feed';
import Sidebar from '@/components/Sidebar';

export default function Home() {
  return (
    <main className="flex min-h-screen w-full">
      <Sidebar />
      <div className="flex-1 flex justify-center lg:ml-72">
        <div className="w-full max-w-6xl px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
          <Feed />
        </div>
      </div>
    </main>
  );
} 