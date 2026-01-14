'use client';

interface GameModeFilterProps {
  selectedMode: string;
  onModeChange: (mode: string) => void;
}

export default function GameModeFilter({ selectedMode, onModeChange }: GameModeFilterProps) {
  const modes = [
    { id: 'all', label: 'All Modes' },
    { id: '420', label: 'Ranked Solo/Duo' },
    { id: '440', label: 'Ranked Flex' },
  ];

  return (
    <div className="flex items-center flex-wrap" style={{ gap: '0.75rem' }}>
      {modes.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          style={{ padding: '0.875rem 1.5rem' }}
          className={`rounded-xl text-sm font-semibold transition-all duration-300 border backdrop-blur-sm ${
            selectedMode === mode.id
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 shadow-lg shadow-cyan-500/20'
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5 border-white/10 hover:border-cyan-500/20'
          }`}
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
