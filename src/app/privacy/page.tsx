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
          Back to Home
        </Link>

        <h1 style={{ fontSize: '36px', fontWeight: 700, marginBottom: '32px', background: 'linear-gradient(to right, #22d3ee, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Privacy Policy
        </h1>

        <div style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.8 }}>
          <section style={sectionStyle}>
            <h2 style={h2Style}>1. Introduction</h2>
            <p><strong>Crocoding</strong> (hereinafter "we", "our" or "Nexra") places great importance on protecting your personal data. This privacy policy describes how we collect, use, and protect your information when you use our Nexra service.</p>
            <p style={{ marginTop: '16px' }}>By using Nexra, you agree to the practices described in this policy.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>2. Data Controller</h2>
            <div style={boxStyle}>
              <p><strong>Crocoding</strong></p>
              <p>51 Boulevard des Belges, 76000 Rouen, France</p>
              <p>Email: <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a></p>
            </div>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>3. Data Collected</h2>
            <p>We collect the following types of data:</p>
            <h3 style={h3Style}>3.1 Identification Data</h3>
            <ul style={listStyle}>
              <li>Email address</li>
              <li>Username</li>
              <li>Profile picture (if signing in via Google)</li>
            </ul>
            <h3 style={h3Style}>3.2 Game Data (via Riot Games API)</h3>
            <ul style={listStyle}>
              <li>Riot ID (Game Name + Tag)</li>
              <li>PUUID (Riot unique identifier)</li>
              <li>Match history</li>
              <li>Game statistics</li>
              <li>Rank and division</li>
            </ul>
            <h3 style={h3Style}>3.3 Technical Data</h3>
            <ul style={listStyle}>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Login data</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>4. Purpose of Processing</h2>
            <p>Your data is used to:</p>
            <ul style={listStyle}>
              <li>Create and manage your user account</li>
              <li>Provide our match analysis services</li>
              <li>Generate personalized advice via our AI</li>
              <li>Improve our services and algorithms</li>
              <li>Send you communications related to your account</li>
              <li>Ensure the security of our platform</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>5. Legal Basis for Processing</h2>
            <p>The processing of your data is based on:</p>
            <ul style={listStyle}>
              <li><strong>Contract performance</strong>: to provide our services</li>
              <li><strong>Your consent</strong>: for linking your Riot account</li>
              <li><strong>Our legitimate interest</strong>: to improve our services and ensure security</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>6. Data Retention</h2>
            <ul style={listStyle}>
              <li><strong>Account data</strong>: retained as long as your account is active, then 3 years after last login</li>
              <li><strong>Game data</strong>: retained 1 year after the last analysis</li>
              <li><strong>Technical data</strong>: retained maximum 12 months</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>7. Data Sharing</h2>
            <p>Your data may be shared with:</p>
            <ul style={listStyle}>
              <li><strong>Riot Games</strong>: via their official API to retrieve your game data</li>
              <li><strong>Vercel</strong>: our hosting provider</li>
              <li><strong>Cloudflare</strong>: for security and performance</li>
              <li><strong>OpenAI/Anthropic</strong>: for AI analysis (anonymized data)</li>
            </ul>
            <p style={{ marginTop: '16px' }}>We never sell your personal data to third parties.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>8. International Transfers</h2>
            <p>Some data may be transferred to countries outside the European Union (particularly the United States for our hosting providers). These transfers are governed by appropriate safeguards (European Commission standard contractual clauses).</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>9. Your Rights</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul style={listStyle}>
              <li><strong>Right of access</strong>: obtain a copy of your data</li>
              <li><strong>Right to rectification</strong>: correct inaccurate data</li>
              <li><strong>Right to erasure</strong>: delete your data</li>
              <li><strong>Right to restriction</strong>: limit the processing of your data</li>
              <li><strong>Right to portability</strong>: receive your data in a structured format</li>
              <li><strong>Right to object</strong>: object to the processing of your data</li>
              <li><strong>Right to withdraw consent</strong> at any time</li>
            </ul>
            <p style={{ marginTop: '16px' }}>To exercise these rights, contact us at: <a href="mailto:contact@crocoding.com" style={linkStyle}>contact@crocoding.com</a></p>
            <p style={{ marginTop: '16px' }}>You may also file a complaint with the CNIL (French Data Protection Authority): <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={linkStyle}>www.cnil.fr</a></p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>10. Cookies</h2>
            <p>We use cookies for:</p>
            <ul style={listStyle}>
              <li><strong>Essential cookies</strong>: necessary for website operation (authentication, session)</li>
              <li><strong>Performance cookies</strong>: to analyze site usage and improve our services</li>
            </ul>
            <p style={{ marginTop: '16px' }}>You can manage your cookie preferences in your browser settings.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>11. Security</h2>
            <p>We implement appropriate technical and organizational security measures to protect your data:</p>
            <ul style={listStyle}>
              <li>Data encryption in transit (HTTPS/TLS)</li>
              <li>Secure password hashing (PBKDF2)</li>
              <li>Restricted data access</li>
              <li>Access monitoring and logging</li>
            </ul>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>12. Protection of Minors</h2>
            <p>Nexra is not intended for persons under 16 years of age. We do not knowingly collect personal data from minors under 16.</p>
          </section>

          <section style={sectionStyle}>
            <h2 style={h2Style}>13. Changes</h2>
            <p>We may modify this privacy policy at any time. In case of substantial changes, we will notify you by email or via a notification on the site.</p>
          </section>

          <section style={{ paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Last updated: January 2025</p>
          </section>
        </div>

        {/* Navigation to other legal pages */}
        <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px' }}>Other Legal Documents</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
            <Link href="/legal" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>Legal Notice</Link>
            <Link href="/terms" style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', textDecoration: 'none' }}>Terms of Service</Link>
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
