'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { FC, ReactNode } from 'react';

type NavLinkProps = {
  href: string;
  children: ReactNode;
};

export const NavLink: FC<NavLinkProps> = ({ href, children }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-primary relative",
        isActive ? "text-primary" : "text-muted-foreground",
      )}
    >
      {children}
      {isActive && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-accent rounded-full"></span>}
    </Link>
  );
};
