'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RecentGames from '@/components/RecentGames';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [riotAccount, setRiotAccount] = useState<{
    gameName: string;
    tagLine: string;
    region: string;
  } | null>(null);

  useEffect(() => {
    const gameName = searchParams.get('gameName');
    const tagLine = searchParams.get('tagLine');
    const region = searchParams.get('region') || 'euw1';

    if (gameName && tagLine) {
      // Save to localStorage for persistence
      const accountData = { gameName, tagLine, region };
      localStorage.setItem('nexra_riot_account', JSON.stringify(accountData));
      setRiotAccount(accountData);
    } else {
      // Try to restore from localStorage
      const saved = localStorage.getItem('nexra_riot_account');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.gameName && parsed.tagLine) {
            setRiotAccount(parsed);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved riot account:', e);
        }
      }
      // No saved account, redirect to login
      router.push('/');
    }
  }, [searchParams, router]);

  if (!riotAccount) {
    return (
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <RecentGames riotAccount={riotAccount} />;
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="glass-card" style={{ padding: '2rem' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
