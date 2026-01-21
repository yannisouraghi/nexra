'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function TermsOfService() {
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
          Conditions Générales d'Utilisation
        </h1>

        <div className="space-y-8 text-white/80 leading-relaxed">
          {/* Préambule */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Préambule</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après "CGU") régissent l'accès et
              l'utilisation du service <strong className="text-cyan-400">Nexra</strong>, édité par la société Crocoding.
            </p>
            <p className="mt-4">
              En créant un compte ou en utilisant Nexra, vous acceptez sans réserve les présentes CGU.
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre service.
            </p>
          </section>

          {/* Définitions */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Définitions</h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>"Service"</strong> : désigne la plateforme Nexra et toutes ses fonctionnalités</li>
              <li><strong>"Utilisateur"</strong> : toute personne utilisant le Service</li>
              <li><strong>"Compte"</strong> : espace personnel créé par l'Utilisateur sur le Service</li>
              <li><strong>"Contenu"</strong> : données, analyses et informations générées par le Service</li>
              <li><strong>"Crédits"</strong> : unités permettant d'utiliser les fonctionnalités d'analyse</li>
            </ul>
          </section>

          {/* Description du service */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Description du Service</h2>
            <p>
              Nexra est une plateforme d'analyse et de coaching pour le jeu League of Legends. Le Service propose :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>L'analyse de vos parties via les données de l'API Riot Games</li>
              <li>Des conseils personnalisés générés par intelligence artificielle</li>
              <li>Le suivi de vos statistiques et de votre progression</li>
              <li>L'identification de vos erreurs et axes d'amélioration</li>
            </ul>
          </section>

          {/* Inscription */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Inscription et Compte</h2>
            <h3 className="text-xl font-medium text-white mt-6 mb-3">4.1 Conditions d'inscription</h3>
            <p>Pour utiliser Nexra, vous devez :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Être âgé d'au moins 16 ans</li>
              <li>Fournir des informations exactes et complètes</li>
              <li>Disposer d'un compte Riot Games valide pour lier votre profil</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">4.2 Sécurité du compte</h3>
            <p>
              Vous êtes responsable de la confidentialité de vos identifiants de connexion.
              Toute activité réalisée depuis votre compte est présumée être de votre fait.
              En cas d'utilisation non autorisée, prévenez-nous immédiatement.
            </p>
          </section>

          {/* Utilisation du service */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Utilisation du Service</h2>
            <h3 className="text-xl font-medium text-white mt-6 mb-3">5.1 Usages autorisés</h3>
            <p>Le Service est destiné à un usage personnel et non commercial. Vous pouvez :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Analyser vos propres parties</li>
              <li>Consulter vos statistiques et conseils</li>
              <li>Utiliser les crédits achetés selon leur destination</li>
            </ul>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">5.2 Usages interdits</h3>
            <p>Il est strictement interdit de :</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Utiliser le Service à des fins illégales ou frauduleuses</li>
              <li>Tenter de contourner les mesures de sécurité</li>
              <li>Accéder aux données d'autres utilisateurs sans autorisation</li>
              <li>Revendre ou transférer votre compte ou vos crédits</li>
              <li>Utiliser des bots ou scripts automatisés</li>
              <li>Copier, modifier ou distribuer le contenu du Service</li>
              <li>Surcharger volontairement nos infrastructures</li>
            </ul>
          </section>

          {/* Crédits et paiement */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Crédits et Paiement</h2>
            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.1 Système de crédits</h3>
            <p>
              Les analyses de parties consomment des crédits. Les nouveaux utilisateurs reçoivent
              des crédits gratuits lors de leur inscription. Des crédits supplémentaires peuvent
              être achetés sur la page Tarifs.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.2 Paiements</h3>
            <p>
              Les paiements sont traités de manière sécurisée via Stripe. En effectuant un achat,
              vous acceptez les conditions de paiement affichées au moment de la transaction.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">6.3 Politique de remboursement</h3>
            <p>
              Les crédits achetés ne sont pas remboursables, sauf en cas de dysfonctionnement
              technique avéré empêchant leur utilisation. Dans ce cas, contactez-nous à{' '}
              <a href="mailto:contact@crocoding.com" className="text-cyan-400 hover:underline">contact@crocoding.com</a>.
            </p>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Propriété intellectuelle</h2>
            <p>
              Tous les éléments du Service (logos, textes, algorithmes, interfaces, etc.) sont la
              propriété exclusive de Crocoding ou de ses partenaires. Toute reproduction ou
              utilisation non autorisée est interdite.
            </p>
            <p className="mt-4">
              Les analyses générées par le Service sont mises à votre disposition pour un usage
              personnel. Vous conservez la propriété de vos données de jeu.
            </p>
          </section>

          {/* Riot Games */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Relation avec Riot Games</h2>
            <p>
              Nexra utilise l'API officielle de Riot Games conformément à leurs conditions d'utilisation.
            </p>
            <p className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              Nexra n'est pas approuvé par Riot Games et ne reflète pas les opinions ou les points
              de vue de Riot Games ou de toute personne officiellement impliquée dans la production
              ou la gestion des propriétés de Riot Games. Riot Games et League of Legends sont des
              marques déposées de Riot Games, Inc.
            </p>
          </section>

          {/* Limitation de responsabilité */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitation de responsabilité</h2>
            <h3 className="text-xl font-medium text-white mt-6 mb-3">9.1 Disponibilité du Service</h3>
            <p>
              Le Service est fourni "en l'état". Nous nous efforçons d'assurer sa disponibilité
              mais ne garantissons pas un fonctionnement ininterrompu. Des maintenances ou
              interruptions peuvent survenir.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">9.2 Conseils et analyses</h3>
            <p>
              Les analyses et conseils fournis par notre IA sont des suggestions destinées à vous
              aider à progresser. Ils ne constituent pas des garanties de résultats. Votre
              progression dépend de nombreux facteurs indépendants de notre Service.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">9.3 Exclusions</h3>
            <p>
              Crocoding ne saurait être tenue responsable des dommages indirects, pertes de données,
              pertes de profits ou interruptions d'activité résultant de l'utilisation du Service.
            </p>
          </section>

          {/* Suspension et résiliation */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Suspension et Résiliation</h2>
            <h3 className="text-xl font-medium text-white mt-6 mb-3">10.1 Par l'Utilisateur</h3>
            <p>
              Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil
              ou en nous contactant. Cette suppression entraîne la perte définitive de vos données
              et crédits non utilisés.
            </p>

            <h3 className="text-xl font-medium text-white mt-6 mb-3">10.2 Par Crocoding</h3>
            <p>
              Nous nous réservons le droit de suspendre ou résilier votre compte en cas de :
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
              <li>Violation des présentes CGU</li>
              <li>Comportement frauduleux ou abusif</li>
              <li>Inactivité prolongée (plus de 24 mois)</li>
              <li>Demande des autorités compétentes</li>
            </ul>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Modifications des CGU</h2>
            <p>
              Nous pouvons modifier ces CGU à tout moment. Les modifications entrent en vigueur
              dès leur publication sur le site. En cas de modification substantielle, nous vous
              en informerons par email. L'utilisation continue du Service après modification
              vaut acceptation des nouvelles CGU.
            </p>
          </section>

          {/* Droit applicable */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Droit applicable et litiges</h2>
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, une solution
              amiable sera recherchée avant toute action judiciaire.
            </p>
            <p className="mt-4">
              À défaut d'accord amiable, les tribunaux de Rouen seront compétents.
            </p>
            <p className="mt-4">
              Conformément à l'article L.612-1 du Code de la consommation, vous pouvez recourir
              gratuitement à un médiateur de la consommation en cas de litige.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, contactez-nous à :{' '}
              <a href="mailto:contact@crocoding.com" className="text-cyan-400 hover:underline">contact@crocoding.com</a>
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
            <Link href="/privacy" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
              Politique de Confidentialité
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
