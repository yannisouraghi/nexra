'use client';

import { useState, useEffect } from 'react';
import { Download, CheckCircle, Monitor } from 'lucide-react';

export default function NexraVisionStatus() {
  const [isRunning, setIsRunning] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  const checkVisionStatus = async () => {
    try {
      const response = await fetch('/api/vision/link');
      const data = await response.json();
      setIsRunning(data.running === true);
    } catch {
      setIsRunning(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkVisionStatus();

    // Check status every 30 seconds
    const interval = setInterval(checkVisionStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return (
      <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Monitor className="w-4 h-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>
              Checking...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isRunning) {
    return (
      <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'rgba(34, 197, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
              Nexra Vision
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>
              Connected
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'rgba(168, 85, 247, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Monitor className="w-4 h-4" style={{ color: '#a855f7' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>
            Nexra Vision
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.5)' }}>
            Not detected
          </div>
        </div>
      </div>
      <button
        onClick={() => {
          window.open('https://github.com/yannisouraghi/nexra-vision/releases/download/v1.0.2/Nexra-Vision-Setup-1-0-2.exe', '_blank');
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.625rem',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          border: 'none',
          color: 'white',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(168, 85, 247, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <Download className="w-4 h-4" />
        Download
      </button>
      <p style={{
        fontSize: 10,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        marginTop: '0.5rem',
      }}>
        Auto-record games for AI analysis
      </p>
    </div>
  );
}
