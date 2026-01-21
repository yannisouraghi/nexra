'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
  const sectionStyle = { marginBottom: '32px' };
  const h2Style = { fontSize: '24px', fontWeight: 600, color: 'white', marginBottom: '16px' };
  const h3Style = { fontSize: '20px', fontWeight: 500, color: 'white', marginTop: '24px', marginBottom: '12px' };
  const boxStyle = { marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' };
  const linkStyle = { color: '#22d3ee', textDecoration: 'none' };
  const listStyle = { marginLeft: '20px', marginTop: '16px' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0a0f', color: 'white' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'white' }}>
          <Image src="/nexra-logo.png" alt="Nexra" width={40} height={40} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '0.1em' }}>NEXRA</span>
        </Link>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '64px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '32px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour à l'accueil
        </Link>

        <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '32px', background: 'linear-gradient(to right, #22d3ee, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Conditions Générales d'Utilisation
        </h1>

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Préambule</h2>
            <p>Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'accès et l'utilisation du service <strong style={{ color: '#22d3ee' }}>Nexra</strong>, édité par la société Crocoding.</p>
            <p style={{ marginTop: '16px' }}>En créant un compte ou en utilisant Nexra, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Définitions</h2>
            <ul style={listStyle}>
              <li><strong>"Service"</strong> : désigne la plateforme Nexra et toutes ses fonctionnalités</li>
              <li><strong>"Utilisateur"</strong> : toute personne utilisant le Service</li>
              <li><strong>"Compte"</strong> : espace personnel créé par l'Utilisateur sur le Service</li>
              <li><strong>"Contenu"</strong> : données, analyses et informations générées par le Service</li>
              <li><strong>"Crédits"</strong> : unités permettant d'utiliser les fonctionnalités d'analyse</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Description du Service</h2>
            <p>Nexra est une plateforme d'analyse et de coaching pour le jeu League of Legends. Le Service propose :</p>
            <ul style={listStyle}>
              <li>L'analyse de vos parties via les données de l'API Riot Games</li>
              <li>Des conseils personnalisés générés par intelligence artificielle</li>
              <li>Le suivi de vos statistiques et de votre progression</li>
              <li>L'identification de vos erreurs et axes d'amélioration</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>4. Inscription et Compte</h2>
            <h3 style={h3Style}>4.1 Conditions d'inscription</h3>
            <p>Pour utiliser Nexra, vous devez :</p>
            <ul style={listStyle}>
              <li>Être âgé d'au moins 16 ans</li>
              <li>Fournir des informations exactes et complètes</li>
              <li>Disposer d'un compte Riot Games valide pour lier votre profil</li>
            </ul>
            <h3 style={h3Style}>4.2 Sécurité du compte</h3>
            <p>Vous êtes responsable de la confidentialité de vos identifiants de connexion. Toute activité réalisée depuis votre compte est présumée être de votre fait.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>5. Utilisation du Service</h2>
            <h3 style={h3Style}>5.1 Usages autorisés</h3>
            <p>Le Service est destiné à un usage personnel et non commercial. Vous pouvez :</p>
            <ul style={listStyle}>
              <li>Analyser vos propres parties</li>
              <li>Consulter vos statistiques et conseils</li>
              <li>Utiliser les crédits achetés selon leur destination</li>
            </ul>
            <h3 style={h3Style}>5.2 Usages interdits</h3>
            <p>Il est strictement interdit de :</p>
            <ul style={listStyle}>
              <li>Utiliser le Service à des fins illégales ou frauduleuses</li>
              <li>Tenter de contourner les mesures de sécurité</li>
              <li>Accéder aux données d'autres utilisateurs sans autorisation</li>
              <li>Revendre ou transférer votre compte ou vos crédits</li>
              <li>Utiliser des bots ou scripts automatisés</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Crédits et Paiement</h2>
            <h3 style={h3Style}>6.1 Système de crédits</h3>
            <p>Les analyses de parties consomment des crédits. Les nouveaux utilisateurs reçoivent des crédits gratuits lors de leur inscription.</p>
            <h3 style={h3Style}>6.2 Paiements</h3>
            <p>Les paiements sont traités de manière sécurisée via Stripe.</p>
            <h3 style={h3Style}>6.3 Politique de remboursement</h3>
            <p>Les crédits achetés ne sont pas remboursables, sauf en cas de dysfonctionnement technique avéré. Contactez-nous à <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a>.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Propriété intellectuelle</h2>
            <p>Tous les éléments du Service (logos, textes, algorithmes, interfaces, etc.) sont la propriété exclusive de Crocoding ou de ses partenaires.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>8. Relation avec Riot Games</h2>
            <p>Nexra utilise l'API officielle de Riot Games conformément à leurs conditions d'utilisation.</p>
            <div style={boxStyle}>
              <p>Nexra n'est pas approuvé par Riot Games et ne reflète pas les opinions de Riot Games. Riot Games et League of Legends sont des marques déposées de Riot Games, Inc.</p>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Limitation de responsabilité</h2>
            <p>Le Service est fourni "en l'état". Les analyses et conseils fournis par notre IA sont des suggestions et ne constituent pas des garanties de résultats.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>10. Suspension et Résiliation</h2>
            <p>Vous pouvez supprimer votre compte à tout moment. Nous nous réservons le droit de suspendre ou résilier votre compte en cas de violation des présentes CGU.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>11. Modifications des CGU</h2>
            <p>Nous pouvons modifier ces CGU à tout moment. Les modifications entrent en vigueur dès leur publication sur le site.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Droit applicable et litiges</h2>
            <p>Les présentes CGU sont régies par le droit français. À défaut d'accord amiable, les tribunaux de Rouen seront compétents.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>13. Contact</h2>
            <p>Pour toute question, contactez-nous à : <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a></p>
          </section>

          <section style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Dernière mise à jour : Janvier 2025</p>
          </section>
        </div>

        {/* Navigation vers autres pages légales */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Autres documents légaux</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <Link href="/legal" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>Mentions Légales</Link>
            <Link href="/privacy" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>Politique de Confidentialité</Link>
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
