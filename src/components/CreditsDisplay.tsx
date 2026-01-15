'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function CreditsDisplay() {
  const { data: session } = useSession();
  const credits = (session?.user as any)?.credits ?? 0;

  return (
    <div className="credits-display">
      <div className="credits-info">
        <div className="credits-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div className="credits-text">
          <span className="credits-label">AI Credits</span>
          <span className="credits-value">{credits}</span>
        </div>
      </div>
      <Link href="/pricing" className="credits-buy-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Buy Credits
      </Link>
    </div>
  );
}
