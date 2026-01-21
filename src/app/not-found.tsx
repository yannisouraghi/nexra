'use client';

import Link from 'next/link';
import Image from 'next/image';
import './globals.css';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0a0a0f',
      color: 'white'
    }}>
      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
          <Image
            src="/nexra-logo.png"
            alt="Nexra"
            width={40}
            height={40}
          />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em' }}>NEXRA</span>
        </Link>
      </nav>

      {/* Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '400px' }}>
          {/* 404 */}
          <div style={{ position: 'relative', marginBottom: '32px' }}>
            <span style={{
              fontSize: '150px',
              fontWeight: 700,
              lineHeight: 1,
              color: 'rgba(255,255,255,0.05)'
            }}>404</span>
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                fontSize: '60px',
                fontWeight: 700,
                background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                404
              </span>
            </div>
          </div>

          {/* Message */}
          <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
            Page non trouvée
          </h1>
          <p style={{ marginBottom: '32px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            Oups ! Cette page n'existe pas ou a été déplacée.
            Pas de panique, retourne sur la Faille de l'invocateur.
          </p>

          {/* Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
            <Link
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 500,
                color: 'white',
                background: 'linear-gradient(to right, #06b6d4, #2563eb)',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Retour à l'accueil
            </Link>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '24px',
        textAlign: 'center',
        fontSize: '14px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        color: 'rgba(255,255,255,0.4)'
      }}>
        <p>&copy; 2025 Nexra - Crocoding</p>
      </footer>
    </div>
  );
}
