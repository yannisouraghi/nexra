'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Navigation */}
      <nav className="nexra-nav" style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Link href="/" className="nexra-logo">
          <Image
            src="/nexra-logo.png"
            alt="Nexra"
            width={40}
            height={40}
            className="nexra-logo-img"
          />
          <span className="nexra-logo-text">NEXRA</span>
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Mentions Légales
        </h1>

        <div className="space-y-8 text-white/80 leading-relaxed">
          {/* Éditeur */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Éditeur du site</h2>
            <p>Le site <strong className="text-cyan-400">nexra-ai.app</strong> est édité par :</p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p><strong>Crocoding</strong></p>
              <p>Société par Actions Simplifiée (SASU)</p>
              <p>Capital social : 500,00 €</p>
              <p>Siège social : 51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>RCS Rouen : 994 623 536</p>
              <p>N° TVA Intracommunautaire : FR7608994623536</p>
              <p className="mt-2">Directeur de la publication : Yannis OURAGHI</p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Contact</h2>
            <p>Email : <a href="mailto:contact@nexra-ai.app" className="text-cyan-400 hover:underline">contact@nexra-ai.app</a></p>
          </section>

          {/* Hébergement */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
              <p><strong>Vercel Inc.</strong></p>
              <p>440 N Barranca Ave #4133</p>
              <p>Covina, CA 91723, États-Unis</p>
              <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">vercel.com</a></p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus présents sur le site Nexra (textes, images, logos, icônes, logiciels, etc.)
              sont protégés par les lois françaises et internationales relatives à la propriété intellectuelle.
            </p>
            <p className="mt-4">
              Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie
              des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans
              autorisation écrite préalable de Crocoding.
            </p>
            <p className="mt-4">
              La marque "Nexra" et le logo associé sont la propriété exclusive de Crocoding.
            </p>
          </section>

          {/* Riot Games */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Mentions relatives à Riot Games</h2>
            <p>
              Nexra n'est pas approuvé par Riot Games et ne reflète pas les opinions ou les points de vue
              de Riot Games ou de toute personne officiellement impliquée dans la production ou la gestion
              des propriétés de Riot Games.
            </p>
            <p className="mt-4">
              Riot Games et toutes les propriétés associées sont des marques déposées ou des marques
              commerciales de Riot Games, Inc.
            </p>
            <p className="mt-4">
              League of Legends™ est une marque déposée de Riot Games, Inc.
            </p>
          </section>

          {/* Données personnelles */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Données personnelles</h2>
            <p>
              Pour plus d'informations sur la collecte et le traitement de vos données personnelles,
              veuillez consulter notre{' '}
              <Link href="/privacy" className="text-cyan-400 hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          {/* Loi applicable */}
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. En cas de litige,
              les tribunaux français seront seuls compétents.
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
            <Link href="/privacy" className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors">
              Politique de Confidentialité
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
