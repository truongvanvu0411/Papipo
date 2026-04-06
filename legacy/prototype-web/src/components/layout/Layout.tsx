import React from 'react';
import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function Layout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] pb-32">
      <main className="max-w-md mx-auto min-h-screen p-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
