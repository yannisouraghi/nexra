'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LegalNotice() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white' }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
          <Image src="/nexra-logo.png" alt="Nexra" width={40} height={40} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em' }}>NEXRA</span>
        </Link>
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.7)',
            textDecoration: 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            textDecoration: 'none',
            marginBottom: '32px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </Link>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '32px',
          background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Legal Notice
        </h1>

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>1. Website Publisher</h2>
            <p>The website <strong style={{ color: '#22d3ee' }}>nexra-ai.app</strong> is published by:</p>
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p><strong>Crocoding</strong></p>
              <p>Simplified Joint-Stock Company (SASU)</p>
              <p>Share capital: €500.00</p>
              <p>Registered office: 51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>RCS Rouen: 994 623 536</p>
              <p>EU VAT Number: FR7608994623536</p>
              <p style={{ marginTop: '8px' }}>Publication Director: Yannis OURAGHI</p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>2. Contact</h2>
            <p>Email: <a href="mailto:contact@crocoding.com" style={{ color: '#22d3ee', textDecoration: 'none' }}>contact@crocoding.com</a></p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>3. Hosting</h2>
            <p>The website is hosted by:</p>
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p><strong>Vercel Inc.</strong></p>
              <p>440 N Barranca Ave #4133</p>
              <p>Covina, CA 91723, USA</p>
              <p>Website: <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee', textDecoration: 'none' }}>vercel.com</a></p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>4. Intellectual Property</h2>
            <p>All content on the Nexra website (texts, images, logos, icons, software, etc.) is protected by French and international intellectual property laws.</p>
            <p style={{ marginTop: '16px' }}>Any reproduction, representation, modification, publication, or adaptation of all or part of the website elements, by any means or process, is prohibited without prior written authorization from Crocoding.</p>
            <p style={{ marginTop: '16px' }}>The "Nexra" trademark and associated logo are the exclusive property of Crocoding.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>5. Riot Games Disclaimer</h2>
            <p>Nexra is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties.</p>
            <p style={{ marginTop: '16px' }}>Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.</p>
            <p style={{ marginTop: '16px' }}>League of Legends™ is a registered trademark of Riot Games, Inc.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>6. Personal Data</h2>
            <p>For more information about the collection and processing of your personal data, please see our <Link href="/privacy" style={{ color: '#22d3ee', textDecoration: 'none' }}>Privacy Policy</Link>.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>7. Applicable Law</h2>
            <p>This legal notice is governed by French law. In case of dispute, French courts shall have exclusive jurisdiction.</p>
          </section>

          <section style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Last updated: January 2025</p>
          </section>
        </div>

        {/* Navigation to other legal pages */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Other Legal Documents</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <Link href="/privacy" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              Terms of Service
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '32px', marginTop: '64px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          <p>&copy; 2025 Nexra - Crocoding. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
