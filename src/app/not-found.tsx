'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Navigation */}
      <nav className="relative flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/nexra-logo.png"
            alt="Nexra"
            width={40}
            height={40}
            className="w-10 h-10"
          />
          <span className="font-rajdhani text-xl font-bold tracking-wider text-white">NEXRA</span>
        </Link>
      </nav>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {/* 404 */}
          <div className="relative mb-8">
            <span className="text-[150px] font-bold text-white/5 leading-none">404</span>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                404
              </span>
            </div>
          </div>

          {/* Message */}
          <h1 className="text-2xl font-semibold text-white mb-4">
            Page non trouvée
          </h1>
          <p className="text-white/60 mb-8">
            Oups ! Cette page n'existe pas ou a été déplacée.
            Pas de panique, retourne sur la Faille de l'invocateur.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-medium text-white hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Retour à l'accueil
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg font-medium text-white/80 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      <footer className="border-t border-white/10 py-6">
        <div className="text-center text-white/40 text-sm">
          <p>&copy; 2025 Nexra - Crocoding</p>
        </div>
      </footer>
    </div>
  );
}
