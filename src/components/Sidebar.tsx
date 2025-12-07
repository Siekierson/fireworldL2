'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const NavLinks = () => (
    <>
      <li>
        <Link
          href="/"
          className={`flex items-center space-x-2 sm:space-x-3 lg:space-x-4 text-orange-500 hover:text-orange-400 transition p-2 sm:p-2.5 lg:p-3 rounded-lg hover:bg-white/5 text-base sm:text-lg lg:text-xl font-semibold ${
            pathname === '/' ? 'text-orange-400 bg-white/5' : ''
          }`}
        >
          <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          <span>Home</span>
        </Link>
      </li>
      <li>
        <Link
          href="/profile"
          className={`flex items-center space-x-2 sm:space-x-3 lg:space-x-4 text-orange-500 hover:text-orange-400 transition p-2 sm:p-2.5 lg:p-3 rounded-lg hover:bg-white/5 text-base sm:text-lg lg:text-xl font-semibold ${
            pathname === '/profile' ? 'text-orange-400 bg-white/5' : ''
          }`}
        >
          <UserIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          <span>Profile</span>
        </Link>
      </li>
      <li>
        <Link
          href="/messages"
          className={`flex items-center space-x-2 sm:space-x-3 lg:space-x-4 text-orange-500 hover:text-orange-400 transition p-2 sm:p-2.5 lg:p-3 rounded-lg hover:bg-white/5 text-base sm:text-lg lg:text-xl font-semibold ${
            pathname === '/messages' ? 'text-orange-400 bg-white/5' : ''
          }`}
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
          <span>Messages</span>
        </Link>
      </li>
    </>
  );

  const UserSection = () => (
    <>
      {user && (
        <div className="p-4 sm:p-6 lg:p-8">
          <Link
            href="/profile"
            className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 mb-3 sm:mb-4 hover:bg-white/5 rounded-lg p-2 transition cursor-pointer"
          >
            {user.imageURL ? (
              <Image
                src={user.imageURL}
                alt={user.name || 'User'}
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0"
              />
            ) : (
              <Image
                src="/default-avatar.png"
                alt="Default Avatar"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full flex-shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-orange-500 font-bold text-base sm:text-lg lg:text-xl truncate">{user.name}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 sm:space-x-3 lg:space-x-4 text-orange-500 hover:text-orange-400 transition p-2 sm:p-2.5 lg:p-3 rounded-lg hover:bg-white/5 w-full text-base sm:text-lg lg:text-xl font-semibold"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#541010] backdrop-blur-lg">
        <div className="flex items-center justify-between p-2 sm:p-3 md:p-4">
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <Image
              src="/logo.png"
              alt="FireWorld Logo"
              width={40}
              height={40}
              className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg"
            />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-500">FireWorld</h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-orange-500 p-2 sm:p-2.5 md:p-3 hover:text-orange-400 transition"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
            ) : (
              <Bars3Icon className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
            )}
          </button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="bg-[#541010] backdrop-blur-lg border-t border-white/10">
            <nav className="p-3 sm:p-4">
              <ul className="space-y-2 sm:space-y-3">
                <NavLinks />
              </ul>
            </nav>
            <div className="p-3 sm:p-4 border-t border-white/10">
              <UserSection />
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block w-64 xl:w-72 h-screen bg-[#541010] backdrop-blur-lg p-6 xl:p-8 flex flex-col fixed left-0 top-0">
        <div className="flex-none flex items-center space-x-3 xl:space-x-4 mb-8 xl:mb-10">
          <Image
            src="/logo.png"
            alt="FireWorld Logo"
            width={48}
            height={48}
            className="w-10 h-10 xl:w-14 xl:h-14 rounded-lg"
          />
          <h1 className="text-2xl xl:text-4xl font-bold text-orange-500">FireWorld</h1>
        </div>

        <nav className="flex-1">
          <ul className="space-y-3 xl:space-y-4">
            <NavLinks />
          </ul>
        </nav>
      </div>

      <div className="hidden lg:block w-64 xl:w-72 fixed left-0 bottom-0 bg-[#541010] backdrop-blur-lg border-t border-white/10">
        <UserSection />
      </div>

      <div className="lg:hidden h-16 sm:h-20" />
    </>
  );
} 