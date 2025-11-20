'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  const linkClass = (path: string) => {
    const baseClass = "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors";
    if (isActive(path)) {
      return `${baseClass} border-indigo-500 text-indigo-600`;
    }
    return `${baseClass} border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700`;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600 hover:text-indigo-700">
                🤖 LINE Chatbot
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/" className={linkClass('/')}>
                Dashboard
              </Link>
              <Link href="/conversations" className={linkClass('/conversations')}>
                Conversations
              </Link>
              <Link href="/stats" className={linkClass('/stats')}>
                Statistics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

