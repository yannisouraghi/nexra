'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MentionsLegales() {
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
          Retour à l'accueil
        </Link>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 700,
          marginBottom: '32px',
          background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Mentions Légales
        </h1>

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>1. Éditeur du site</h2>
            <p>Le site <strong style={{ color: '#22d3ee' }}>nexra-ai.app</strong> est édité par :</p>
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p><strong>Crocoding</strong></p>
              <p>Société par Actions Simplifiée (SASU)</p>
              <p>Capital social : 500,00 €</p>
              <p>Siège social : 51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>RCS Rouen : 994 623 536</p>
              <p>N° TVA Intracommunautaire : FR7608994623536</p>
              <p style={{ marginTop: '8px' }}>Directeur de la publication : Yannis OURAGHI</p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>2. Contact</h2>
            <p>Email : <a href="mailto:contact@crocoding.com" style={{ color: '#22d3ee', textDecoration: 'none' }}>contact@crocoding.com</a></p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>3. Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p><strong>Vercel Inc.</strong></p>
              <p>440 N Barranca Ave #4133</p>
              <p>Covina, CA 91723, États-Unis</p>
              <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#22d3ee', textDecoration: 'none' }}>vercel.com</a></p>
            </div>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>4. Propriété intellectuelle</h2>
            <p>L'ensemble des contenus présents sur le site Nexra (textes, images, logos, icônes, logiciels, etc.) sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
            <p style={{ marginTop: '16px' }}>Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans autorisation écrite préalable de Crocoding.</p>
            <p style={{ marginTop: '16px' }}>La marque "Nexra" et le logo associé sont la propriété exclusive de Crocoding.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>5. Mentions relatives à Riot Games</h2>
            <p>Nexra n'est pas approuvé par Riot Games et ne reflète pas les opinions ou les points de vue de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion des propriétés de Riot Games.</p>
            <p style={{ marginTop: '16px' }}>Riot Games et toutes les propriétés associées sont des marques déposées ou des marques commerciales de Riot Games, Inc.</p>
            <p style={{ marginTop: '16px' }}>League of Legends™ est une marque déposée de Riot Games, Inc.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>6. Données personnelles</h2>
            <p>Pour plus d'informations sur la collecte et le traitement de vos données personnelles, veuillez consulter notre <Link href="/privacy" style={{ color: '#22d3ee', textDecoration: 'none' }}>Politique de Confidentialité</Link>.</p>
          </section>

          <section style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>7. Droit applicable</h2>
            <p>Les présentes mentions légales sont régies par le droit français. En cas de litige, les tribunaux français seront seuls compétents.</p>
          </section>

          <section style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Dernière mise à jour : Janvier 2025</p>
          </section>
        </div>

        {/* Navigation vers autres pages légales */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Autres documents légaux</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <Link href="/privacy" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              Politique de Confidentialité
            </Link>
            <Link href="/terms" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>
              CGU
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '32px', marginTop: '64px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
          <p>&copy; 2025 Nexra - Crocoding. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
