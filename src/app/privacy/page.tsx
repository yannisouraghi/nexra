'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
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
          Politique de Confidentialité
        </h1>

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Introduction</h2>
            <p>La société <strong>Crocoding</strong> (ci-après "nous", "notre" ou "Nexra") accorde une grande importance à la protection de vos données personnelles. Cette politique de confidentialité décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous utilisez notre service Nexra.</p>
            <p style={{ marginTop: '16px' }}>En utilisant Nexra, vous acceptez les pratiques décrites dans cette politique.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Responsable du traitement</h2>
            <div style={boxStyle}>
              <p><strong>Crocoding</strong></p>
              <p>51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>Email : <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a></p>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Données collectées</h2>
            <p>Nous collectons les types de données suivants :</p>
            <h3 style={h3Style}>3.1 Données d'identification</h3>
            <ul style={listStyle}>
              <li>Adresse email</li>
              <li>Nom d'utilisateur</li>
              <li>Photo de profil (si connexion via Google)</li>
            </ul>
            <h3 style={h3Style}>3.2 Données de jeu (via Riot Games API)</h3>
            <ul style={listStyle}>
              <li>Identifiant Riot (Game Name + Tag)</li>
              <li>PUUID (identifiant unique Riot)</li>
              <li>Historique des parties</li>
              <li>Statistiques de jeu</li>
              <li>Rang et division</li>
            </ul>
            <h3 style={h3Style}>3.3 Données techniques</h3>
            <ul style={listStyle}>
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Données de connexion</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>4. Finalités du traitement</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul style={listStyle}>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Fournir nos services d'analyse de parties</li>
              <li>Générer des conseils personnalisés via notre IA</li>
              <li>Améliorer nos services et algorithmes</li>
              <li>Vous envoyer des communications relatives à votre compte</li>
              <li>Assurer la sécurité de notre plateforme</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>5. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul style={listStyle}>
              <li><strong>L'exécution du contrat</strong> : pour fournir nos services</li>
              <li><strong>Votre consentement</strong> : pour la liaison de votre compte Riot</li>
              <li><strong>Notre intérêt légitime</strong> : pour améliorer nos services et assurer la sécurité</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Durée de conservation</h2>
            <ul style={listStyle}>
              <li><strong>Données de compte</strong> : conservées tant que votre compte est actif, puis 3 ans après la dernière connexion</li>
              <li><strong>Données de jeu</strong> : conservées 1 an après la dernière analyse</li>
              <li><strong>Données techniques</strong> : conservées 12 mois maximum</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Partage des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul style={listStyle}>
              <li><strong>Riot Games</strong> : via leur API officielle pour récupérer vos données de jeu</li>
              <li><strong>Vercel</strong> : notre hébergeur</li>
              <li><strong>Cloudflare</strong> : pour la sécurité et les performances</li>
              <li><strong>OpenAI/Anthropic</strong> : pour l'analyse IA (données anonymisées)</li>
            </ul>
            <p style={{ marginTop: '16px' }}>Nous ne vendons jamais vos données personnelles à des tiers.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>8. Transferts internationaux</h2>
            <p>Certaines données peuvent être transférées vers des pays hors de l'Union Européenne (notamment les États-Unis pour nos prestataires d'hébergement). Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne).</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul style={listStyle}>
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : supprimer vos données</li>
              <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
            </ul>
            <p style={{ marginTop: '16px' }}>Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a></p>
            <p style={{ marginTop: '16px' }}>Vous pouvez également introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.cnil.fr</a></p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>10. Cookies</h2>
            <p>Nous utilisons des cookies pour :</p>
            <ul style={listStyle}>
              <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site (authentification, session)</li>
              <li><strong>Cookies de performance</strong> : pour analyser l'utilisation du site et améliorer nos services</li>
            </ul>
            <p style={{ marginTop: '16px' }}>Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>11. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données :</p>
            <ul style={listStyle}>
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Hachage sécurisé des mots de passe (PBKDF2)</li>
              <li>Accès restreint aux données</li>
              <li>Surveillance et journalisation des accès</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Protection des mineurs</h2>
            <p>Nexra n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs de moins de 16 ans.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>13. Modifications</h2>
            <p>Nous pouvons modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur le site.</p>
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
            <Link href="/terms" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>CGU</Link>
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
