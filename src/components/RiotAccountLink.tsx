'use client';

import { useState } from 'react';

interface RiotAccountLinkProps {
  onLink: (account: { gameName: string; tagLine: string; region: string }) => void;
}

export default function RiotAccountLink({ onLink }: RiotAccountLinkProps) {
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [region, setRegion] = useState('euw1');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const regions = [
    { value: 'euw1', label: 'EUW' },
    { value: 'eun1', label: 'EUNE' },
    { value: 'na1', label: 'NA' },
    { value: 'br1', label: 'BR' },
    { value: 'la1', label: 'LAN' },
    { value: 'la2', label: 'LAS' },
    { value: 'oc1', label: 'OCE' },
    { value: 'ru', label: 'RU' },
    { value: 'tr1', label: 'TR' },
    { value: 'jp1', label: 'JP' },
    { value: 'kr', label: 'KR' },
    { value: 'ph2', label: 'PH' },
    { value: 'sg2', label: 'SG' },
    { value: 'th2', label: 'TH' },
    { value: 'tw2', label: 'TW' },
    { value: 'vn2', label: 'VN' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!gameName || !tagLine) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    try {
      onLink({ gameName, tagLine, region });
    } catch (err) {
      setError('Error linking account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = () => {
    window.location.href = '/api/auth/riot';
  };

  return (
    <div className="glass-card" style={{ padding: '1.75rem 2rem' }}>
      {/* Riot OAuth Button */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={handleOAuthLogin}
          disabled={isLoading}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 hover:scale-[1.01] hover:shadow-lg hover:shadow-red-600/30 active:scale-[0.99]"
          style={{ position: 'relative', zIndex: 1, padding: '0.75rem 1.25rem', maxWidth: '320px', width: '100%' }}
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L1.608 6v12L12 24l10.392-6V6L12 0zm0 2.408L20.472 7.2v9.6L12 21.592 3.528 16.8V7.2L12 2.408z"/>
          </svg>
          <span>Sign in with Riot Games</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative" style={{ marginBottom: '1.5rem' }}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}></div>
        </div>
        <div className="relative flex justify-center">
          <span className="px-4 text-xs uppercase tracking-wider" style={{ color: 'rgba(255, 255, 255, 0.4)', backgroundColor: 'var(--glass-subtle)' }}>Or enter manually</span>
        </div>
      </div>

      {/* Compact Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
          <input
            type="text"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            placeholder="Game Name"
            disabled={isLoading}
            className="md:col-span-1"
          />
          <input
            type="text"
            value={tagLine}
            onChange={(e) => setTagLine(e.target.value)}
            placeholder="Tag"
            disabled={isLoading}
            className="md:col-span-1"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isLoading}
            className="md:col-span-1"
          >
            {regions.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20" style={{ marginBottom: '1.25rem' }}>
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}>
          <button
            type="submit"
            disabled={isLoading}
            className="accent-button"
          >
            <span>{isLoading ? 'Connecting...' : 'Start Tracking'}</span>
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          Example: GameName "Hide on bush" + Tag "KR1"
        </p>
      </form>
    </div>
  );
}
