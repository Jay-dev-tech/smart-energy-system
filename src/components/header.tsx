
'use client';
import { SidebarTrigger } from './ui/sidebar';
import { Logo } from './logo';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Logo />
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <nav className="flex items-center">
            {/* User-specific items can go here */}
          </nav>
        </div>
      </div>
    </header>
  );
}
