'use client';

import { BarChart3, Trophy, Sparkles } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'champions', label: 'Champions', icon: Trophy },
    { id: 'analysis', label: 'Analysis', icon: Sparkles },
  ];

  return (
    <div className="glass-card relative overflow-hidden" style={{ padding: '0.75rem', width: '100%' }}>
      {/* Accent line - vertical on desktop, horizontal on mobile */}
      <div className="absolute top-0 left-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent hidden lg:block"></div>
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent lg:hidden"></div>

      {/* Desktop: Vertical Navigation */}
      <nav className="hidden lg:flex flex-col" style={{ gap: '0.5rem' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative w-full text-left rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={activeTab === tab.id ? {
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
                padding: '1rem'
              } : { padding: '1rem' }}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 animate-fadeIn"></div>
              )}
              <div className="relative z-10 flex items-center" style={{ gap: '0.875rem' }}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="tracking-wide">{tab.label}</span>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: Horizontal Navigation */}
      <nav className="flex lg:hidden flex-wrap justify-center" style={{ gap: '0.5rem' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative rounded-xl font-semibold text-sm transition-all duration-300 flex items-center ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/40'
                  : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={activeTab === tab.id ? {
                boxShadow: '0 0 20px rgba(0, 212, 255, 0.2)',
                padding: '0.75rem 1rem',
                gap: '0.5rem'
              } : { padding: '0.75rem 1rem', gap: '0.5rem' }}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-blue-500/5 animate-fadeIn"></div>
              )}
              <Icon className="w-4 h-4 flex-shrink-0 relative z-10" />
              <span className="tracking-wide relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
