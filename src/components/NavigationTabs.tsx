'use client';

import { BarChart3, Trophy, Sparkles, Radio } from 'lucide-react';

interface NavigationTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isInGame?: boolean;
}

export default function NavigationTabs({ activeTab, onTabChange, isInGame }: NavigationTabsProps) {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: BarChart3 },
    { id: 'champions', label: 'Champions', icon: Trophy },
    { id: 'analysis', label: 'Analysis', icon: Sparkles },
    { id: 'livegame', label: 'Live Game', icon: Radio, highlight: isInGame },
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
          const isLiveAndInGame = tab.id === 'livegame' && tab.highlight;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative w-full text-left rounded-xl font-semibold text-sm transition-all duration-300 ${
                activeTab === tab.id
                  ? isLiveAndInGame
                    ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-green-300 border border-green-500/40'
                    : 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/40'
                  : isLiveAndInGame
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30'
                    : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={activeTab === tab.id ? {
                boxShadow: isLiveAndInGame ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 0 20px rgba(0, 212, 255, 0.2)',
                padding: '1rem'
              } : { padding: '1rem' }}
            >
              {activeTab === tab.id && (
                <div className={`absolute inset-0 rounded-xl ${isLiveAndInGame ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5' : 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5'} animate-fadeIn`}></div>
              )}
              <div className="relative z-10 flex items-center" style={{ gap: '0.875rem' }}>
                <div className="relative">
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isLiveAndInGame ? 'text-green-400' : ''}`} />
                  {isLiveAndInGame && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="tracking-wide">{tab.label}</span>
                {tab.badge && (
                  <span style={{
                    marginLeft: 'auto',
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(234, 179, 8, 0.15)',
                    color: '#eab308',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {tab.badge}
                  </span>
                )}
                {isLiveAndInGame && activeTab !== tab.id && (
                  <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                    LIVE
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Mobile: Horizontal Navigation */}
      <nav className="flex lg:hidden flex-wrap justify-center" style={{ gap: '0.5rem' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isLiveAndInGame = tab.id === 'livegame' && tab.highlight;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative rounded-xl font-semibold text-sm transition-all duration-300 flex items-center ${
                activeTab === tab.id
                  ? isLiveAndInGame
                    ? 'bg-gradient-to-r from-green-500/15 to-emerald-500/15 text-green-300 border border-green-500/40'
                    : 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-300 border border-cyan-500/40'
                  : isLiveAndInGame
                    ? 'text-green-400 hover:text-green-300 hover:bg-green-500/10 border border-green-500/30'
                    : 'text-[var(--text-tertiary)] hover:text-white hover:bg-white/5 border border-transparent'
              }`}
              style={activeTab === tab.id ? {
                boxShadow: isLiveAndInGame ? '0 0 20px rgba(34, 197, 94, 0.3)' : '0 0 20px rgba(0, 212, 255, 0.2)',
                padding: '0.75rem 1rem',
                gap: '0.5rem'
              } : { padding: '0.75rem 1rem', gap: '0.5rem' }}
            >
              {activeTab === tab.id && (
                <div className={`absolute inset-0 rounded-xl ${isLiveAndInGame ? 'bg-gradient-to-r from-green-500/5 to-emerald-500/5' : 'bg-gradient-to-r from-cyan-500/5 to-blue-500/5'} animate-fadeIn`}></div>
              )}
              <div className="relative">
                <Icon className={`w-4 h-4 flex-shrink-0 relative z-10 ${isLiveAndInGame ? 'text-green-400' : ''}`} />
                {isLiveAndInGame && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
                {tab.badge && (
                  <span style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-4px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#eab308',
                  }} />
                )}
              </div>
              <span className="tracking-wide relative z-10 hidden sm:inline">{tab.label}</span>
              {tab.badge && (
                <span className="hidden sm:inline" style={{
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '1px 4px',
                  borderRadius: '3px',
                  background: 'rgba(234, 179, 8, 0.15)',
                  color: '#eab308',
                  textTransform: 'uppercase',
                  marginLeft: '4px',
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
