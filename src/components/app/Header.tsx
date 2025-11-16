'use client';

import Link from 'next/link';
import { CodeXml } from 'lucide-react';
import { NavLink } from './NavLink';

export function Header() {
  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border shadow-sm sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3 text-lg font-bold text-foreground">
            <CodeXml className="w-7 h-7 text-accent" />
            <span className="font-headline hidden sm:inline">CapUpdate Manager</span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/saved">Saved</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
