'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
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
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Dashboard
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-cyan-400 transition-colors mb-8"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Politique de Confidentialité
        </h1>

        <div className="space-y-8 text-white/80 leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              La société <strong>Crocoding</strong> (ci-après "nous", "notre" ou "Nexra") accorde une grande
              importance à la protection de vos données personnelles. Cette politique de confidentialité
              décrit comment nous collectons, utilisons et protégeons vos informations lorsque vous
              utilisez notre service Nexra.
            </p>
            <p className="mt-4">
              En utilisant Nexra, vous acceptez les pratiques décrites dans cette politique.
            </p>
          </section>

          {/* Responsable du traitement */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Responsable du traitement</h2>
            <div className="p-4 bg-white/5 rounded-lg border border-white/10">
              <p><strong>Crocoding</strong></p>
              <p>51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>Email : <a href="mailto:contact@nexra-ai.app" className="text-cyan-400 hover:underline">contact@nexra-ai.app</a></p>
            </div>
          </section>

          {/* Données collectées */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Données collectées</h2>
            <p>Nous collectons les types de données suivants :</p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.1 Données d'identification</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Adresse email</li>
              <li>Nom d'utilisateur</li>
              <li>Photo de profil (si connexion via Google)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.2 Données de jeu (via Riot Games API)</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Identifiant Riot (Game Name + Tag)</li>
              <li>PUUID (identifiant unique Riot)</li>
              <li>Historique des parties</li>
              <li>Statistiques de jeu</li>
              <li>Rang et division</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">3.3 Données techniques</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Données de connexion</li>
            </ul>
          </section>

          {/* Finalités */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Finalités du traitement</h2>
            <p>Vos données sont utilisées pour :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Fournir nos services d'analyse de parties</li>
              <li>Générer des conseils personnalisés via notre IA</li>
              <li>Améliorer nos services et algorithmes</li>
              <li>Vous envoyer des communications relatives à votre compte</li>
              <li>Assurer la sécurité de notre plateforme</li>
            </ul>
          </section>

          {/* Base légale */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><strong>L'exécution du contrat</strong> : pour fournir nos services</li>
              <li><strong>Votre consentement</strong> : pour la liaison de votre compte Riot</li>
              <li><strong>Notre intérêt légitime</strong> : pour améliorer nos services et assurer la sécurité</li>
            </ul>
          </section>

          {/* Conservation */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Durée de conservation</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Données de compte</strong> : conservées tant que votre compte est actif, puis 3 ans après la dernière connexion</li>
              <li><strong>Données de jeu</strong> : conservées 1 an après la dernière analyse</li>
              <li><strong>Données techniques</strong> : conservées 12 mois maximum</li>
            </ul>
          </section>

          {/* Partage */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Partage des données</h2>
            <p>Vos données peuvent être partagées avec :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><strong>Riot Games</strong> : via leur API officielle pour récupérer vos données de jeu</li>
              <li><strong>Vercel</strong> : notre hébergeur</li>
              <li><strong>Cloudflare</strong> : pour la sécurité et les performances</li>
              <li><strong>OpenAI/Anthropic</strong> : pour l'analyse IA (données anonymisées)</li>
            </ul>
            <p className="mt-4">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          {/* Transferts internationaux */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Transferts internationaux</h2>
            <p>
              Certaines données peuvent être transférées vers des pays hors de l'Union Européenne
              (notamment les États-Unis pour nos prestataires d'hébergement). Ces transferts sont
              encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne).
            </p>
          </section>

          {/* Droits */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><strong>Droit d'accès</strong> : obtenir une copie de vos données</li>
              <li><strong>Droit de rectification</strong> : corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement</strong> : supprimer vos données</li>
              <li><strong>Droit à la limitation</strong> : limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité</strong> : recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition</strong> : vous opposer au traitement de vos données</li>
              <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à :{' '}
              <a href="mailto:contact@nexra-ai.app" className="text-cyan-400 hover:underline">contact@nexra-ai.app</a>
            </p>
            <p className="mt-4">
              Vous pouvez également introduire une réclamation auprès de la CNIL :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">www.cnil.fr</a>
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Cookies</h2>
            <p>Nous utilisons des cookies pour :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li><strong>Cookies essentiels</strong> : nécessaires au fonctionnement du site (authentification, session)</li>
              <li><strong>Cookies de performance</strong> : pour analyser l'utilisation du site et améliorer nos services</li>
            </ul>
            <p className="mt-4">
              Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.
            </p>
          </section>

          {/* Sécurité */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées
              pour protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>Chiffrement des données en transit (HTTPS/TLS)</li>
              <li>Hachage sécurisé des mots de passe (PBKDF2)</li>
              <li>Accès restreint aux données</li>
              <li>Surveillance et journalisation des accès</li>
            </ul>
          </section>

          {/* Mineurs */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Protection des mineurs</h2>
            <p>
              Nexra n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas
              sciemment de données personnelles concernant des mineurs de moins de 16 ans.
              Si vous êtes parent et découvrez que votre enfant nous a fourni des données,
              contactez-nous pour les supprimer.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Modifications</h2>
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment.
              En cas de modification substantielle, nous vous en informerons par email
              ou via une notification sur le site. La date de dernière mise à jour est
              indiquée en bas de cette page.
            </p>
          </section>

          {/* Date de mise à jour */}
          <section className="pt-8 border-t border-white/10">
            <p className="text-sm text-white/50">
              Dernière mise à jour : Janvier 2025
            </p>
          </section>
        </div>

        {/* Navigation vers autres pages légales */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Autres documents légaux</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/legal" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
              Mentions Légales
            </Link>
            <Link href="/terms" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="max-w-4xl mx-auto px-6 text-center text-white/50 text-sm">
          <p>&copy; 2025 Nexra - Crocoding. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
