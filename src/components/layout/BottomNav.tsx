import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Activity, Utensils, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { t } = useTranslation();

  const navItems = [
    { to: '/', icon: Home, label: t('nav.today') },
    { to: '/workout', icon: Activity, label: t('nav.workout') },
    { to: '/coach', icon: MessageSquare, label: t('nav.coach') },
    { to: '/nutrition', icon: Utensils, label: t('nav.nutrition') },
    { to: '/profile', icon: User, label: t('nav.profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-6 pb-8 z-50 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <div className="clay-card py-3 px-6 flex justify-between items-center rounded-[2.5rem]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300",
                  isActive ? "text-[var(--color-primary)] shadow-clay-inset bg-[var(--color-bg-base)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                )
              }
            >
              <item.icon className="w-6 h-6 mb-1" strokeWidth={2.5} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
