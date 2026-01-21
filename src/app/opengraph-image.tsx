import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Nexra - AI-Powered League of Legends Coach';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0f',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(0, 212, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(0, 102, 255, 0.15) 0%, transparent 50%)',
        }}
      >
        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #00d4ff 0%, #0066ff 50%, #00d4ff 100%)',
          }}
        />

        {/* Logo container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          {/* Hexagon logo representation */}
          <div
            style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #00d4ff 0%, #0066ff 100%)',
              borderRadius: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(0, 212, 255, 0.4)',
            }}
          >
            <svg
              width="70"
              height="70"
              viewBox="0 0 40 40"
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            >
              <path
                d="M20 4L6 12v16l14 8 14-8V12L20 4z"
                stroke="white"
                strokeWidth="2"
                fill="none"
              />
              <circle cx="20" cy="20" r="5" fill="white" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '72px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '8px',
              marginBottom: '20px',
            }}
          >
            NEXRA
          </span>
          <span
            style={{
              fontSize: '32px',
              fontWeight: 500,
              color: 'rgba(255, 255, 255, 0.7)',
              letterSpacing: '2px',
            }}
          >
            AI-Powered League of Legends Coach
          </span>
        </div>

        {/* Bottom tagline */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#00d4ff',
              boxShadow: '0 0 12px #00d4ff',
            }}
          />
          <span
            style={{
              fontSize: '20px',
              color: 'rgba(255, 255, 255, 0.5)',
              letterSpacing: '4px',
              textTransform: 'uppercase',
            }}
          >
            Analyse • Conseils IA • Progression
          </span>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#0066ff',
              boxShadow: '0 0 12px #0066ff',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
