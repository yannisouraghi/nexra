'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const NEXRA_API_URL = process.env.NEXT_PUBLIC_NEXRA_API_URL || 'https://nexra-api.nexra-api.workers.dev';

function getAuthHeaders(userId?: string, email?: string): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId && email) {
    headers['Authorization'] = `Bearer ${userId}:${email}`;
  }
  return headers;
}

interface UserData {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  authProvider: string;
  riotGameName: string | null;
  riotTagLine: string | null;
  riotRegion: string | null;
  credits: number;
  subscriptionTier: string;
  createdAt: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');

  // Form states
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && session?.user?.id) {
      fetchUserData();
    }
  }, [isOpen, session]);

  const fetchUserData = async () => {
    try {
      const user = session?.user as { id?: string; email?: string };
      const response = await fetch(`${NEXRA_API_URL}/users/${user?.id}`, {
        headers: getAuthHeaders(user?.id, user?.email),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUserData(data.data);
          setName(data.data.name || '');
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const user = session?.user as { id?: string; email?: string };
      const response = await fetch(`${NEXRA_API_URL}/users/${user?.id}/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(user?.id, user?.email),
        body: JSON.stringify({ name }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated!' });
        await updateSession();
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlinkRiot = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const user = session?.user as { id?: string; email?: string };
      const response = await fetch(`${NEXRA_API_URL}/users/${user?.id}/link-riot`, {
        method: 'DELETE',
        headers: getAuthHeaders(user?.id, user?.email),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.removeItem('nexra_riot_account');
        localStorage.setItem('nexra_riot_unlinked', 'true');
        setMessage({ type: 'success', text: 'Riot account unlinked' });
        fetchUserData();
        // Redirect to link-riot page after unlink
        setTimeout(() => {
          onClose();
          router.push('/link-riot');
        }, 1000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to unlink' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') {
      setMessage({ type: 'error', text: 'Please type DELETE to confirm' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const user = session?.user as { id?: string; email?: string };
      const response = await fetch(`${NEXRA_API_URL}/users/${user?.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(user?.id, user?.email),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.removeItem('nexra_riot_account');
        signOut({ callbackUrl: '/' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to delete account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const navItems = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'linked', label: 'Riot Account', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'subscription', label: 'Credits', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '48rem',
          maxHeight: '80vh',
          overflow: 'hidden',
          borderRadius: '1rem',
          background: 'linear-gradient(to bottom right, rgba(15, 15, 25, 0.98), rgba(10, 10, 20, 0.98))',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', fontFamily: 'Rajdhani, sans-serif' }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: 'rgba(255, 255, 255, 0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
          >
            <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.6)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', height: 'calc(80vh - 4rem)', overflow: 'hidden' }}>
          {/* Sidebar */}
          <nav style={{
            width: '12rem',
            flexShrink: 0,
            padding: '1rem',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            overflowY: 'auto',
          }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.625rem 0.875rem',
                  marginBottom: '0.25rem',
                  borderRadius: '0.5rem',
                  textAlign: 'left',
                  border: activeSection === item.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                  background: activeSection === item.id ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
                  color: activeSection === item.id ? 'rgb(103, 232, 249)' : 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <svg style={{ width: '1.125rem', height: '1.125rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Main Content */}
          <main style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
            {/* Message */}
            {message && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
                fontSize: '0.875rem',
              }}>
                {message.text}
              </div>
            )}

            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid rgba(0, 212, 255, 0.2)', borderTopColor: 'rgb(0, 212, 255)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : (
              <>
                {/* Profile Section */}
                {activeSection === 'profile' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>Profile Information</h3>

                    <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'linear-gradient(to bottom right, rgb(6, 182, 212), rgb(59, 130, 246))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>
                            {(userData?.name || userData?.email || '?')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{userData?.name || 'No name set'}</p>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>{userData?.email}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.375rem' }}>Display Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your display name"
                          style={{ width: '100%', padding: '0.625rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none', fontSize: '0.875rem' }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))', color: 'white', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Linked Accounts Section */}
                {activeSection === 'linked' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>Riot Account</h3>

                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgb(248, 113, 113)' }} viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12.534 21.77l-1.09-2.81 10.52.54-.451 4.5zM15.06 0L.307 6.969 2.59 17.471H5.6l-.52-7.084 2.688-1.478.623 8.562h3.01l-.58-10.2 2.779-1.53.796 11.73h3.09l-.18-14.583z" />
                            </svg>
                          </div>
                          <div>
                            <p style={{ color: 'white', fontWeight: 500, fontSize: '0.9375rem' }}>Riot Games</p>
                            {userData?.riotGameName ? (
                              <p style={{ fontSize: '0.8125rem', color: 'rgb(34, 211, 238)' }}>
                                {userData.riotGameName}#{userData.riotTagLine}
                                <span style={{ color: 'rgba(255, 255, 255, 0.3)', marginLeft: '0.5rem' }}>({userData.riotRegion?.toUpperCase()})</span>
                              </p>
                            ) : (
                              <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)' }}>Not linked</p>
                            )}
                          </div>
                        </div>

                        {userData?.riotGameName ? (
                          <button
                            onClick={handleUnlinkRiot}
                            disabled={saving}
                            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'transparent', color: 'rgb(248, 113, 113)', fontSize: '0.8125rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                          >
                            Unlink
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              onClose();
                              router.push('/link-riot');
                            }}
                            style={{ padding: '0.5rem 0.875rem', borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'rgb(34, 211, 238)', fontSize: '0.8125rem', cursor: 'pointer' }}
                          >
                            Link Account
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Subscription Section */}
                {activeSection === 'subscription' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'white', marginBottom: '1rem' }}>Credits & Subscription</h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.15), rgba(59, 130, 246, 0.15))', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>Current Plan</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>
                          {userData?.subscriptionTier || 'Free'}
                        </p>
                      </div>
                      <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'linear-gradient(to bottom right, rgba(234, 179, 8, 0.15), rgba(249, 115, 22, 0.15))', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>Available Credits</p>
                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{userData?.credits || 0}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        router.push('/pricing');
                      }}
                      style={{ padding: '0.625rem 1.25rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))', color: 'white', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
                    >
                      Get More Credits
                    </button>
                  </div>
                )}

                {/* Danger Zone Section */}
                {activeSection === 'danger' && (
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'rgb(248, 113, 113)', marginBottom: '1rem' }}>Danger Zone</h3>

                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'white', marginBottom: '0.375rem' }}>Delete Account</h4>
                      <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1rem' }}>
                        Once deleted, all your data will be permanently removed.
                      </p>

                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'rgb(248, 113, 113)', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer' }}
                        >
                          Delete My Account
                        </button>
                      ) : (
                        <div>
                          <p style={{ fontSize: '0.8125rem', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>
                            Type <span style={{ color: 'rgb(248, 113, 113)', fontFamily: 'monospace', fontWeight: 700 }}>DELETE</span> to confirm:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirm}
                            onChange={(e) => setDeleteConfirm(e.target.value)}
                            placeholder="Type DELETE"
                            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'white', marginBottom: '0.75rem', outline: 'none', fontSize: '0.875rem' }}
                          />
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirm('');
                              }}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer', fontSize: '0.875rem' }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirm !== 'DELETE' || saving}
                              style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: 'rgb(239, 68, 68)', border: 'none', color: 'white', fontWeight: 600, fontSize: '0.875rem', cursor: deleteConfirm !== 'DELETE' || saving ? 'not-allowed' : 'pointer', opacity: deleteConfirm !== 'DELETE' || saving ? 0.5 : 1 }}
                            >
                              {saving ? 'Deleting...' : 'Confirm Delete'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
