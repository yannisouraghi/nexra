'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AnimatedBackground from '@/components/AnimatedBackground';
import { NEXRA_API_URL } from '@/config/api';

// Generate auth header from session
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

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('profile');

  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // UI states
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }

    if (status === 'authenticated' && session?.user?.id) {
      fetchUserData();
    }
  }, [status, session]);

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
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        await updateSession();
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const user = session?.user as { id?: string; email?: string };
      const response = await fetch(`${NEXRA_API_URL}/users/${user?.id}/password`, {
        method: 'PUT',
        headers: getAuthHeaders(user?.id, user?.email),
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
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
      setShowDeleteModal(false);
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
        setMessage({ type: 'success', text: 'Riot account unlinked successfully' });
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to unlink account' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="dashboard-page">
        <AnimatedBackground />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <div className="glass-card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '1.5rem', height: '1.5rem', border: '2px solid rgba(0, 212, 255, 0.2)', borderTopColor: 'rgb(0, 212, 255)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Loading settings...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOAuthUser = userData?.authProvider === 'google';

  const navItems = [
    { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'security', label: 'Security', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'linked', label: 'Linked Accounts', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
    { id: 'subscription', label: 'Subscription', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'danger', label: 'Danger Zone', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
  ];

  return (
    <div className="dashboard-page">
      <AnimatedBackground />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'center', paddingTop: '3rem', paddingBottom: '5rem' }}>
        <div style={{ width: '100%', maxWidth: '56rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: 'white', fontFamily: 'Rajdhani, sans-serif' }}>Settings</h1>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '0.25rem' }}>Manage your account and preferences</p>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.3)'; e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.background = 'transparent'; }}
            >
              <svg style={{ width: '1.25rem', height: '1.25rem', color: 'rgba(255, 255, 255, 0.7)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>Back to Dashboard</span>
            </button>
          </div>

          {/* Message */}
          {message && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: `1px solid ${message.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: message.type === 'success' ? 'rgb(74, 222, 128)' : 'rgb(248, 113, 113)',
              }}
            >
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {/* Sidebar */}
            <aside style={{ width: '14rem', flexShrink: 0 }}>
              <nav className="glass-card" style={{ padding: '0.5rem' }}>
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      textAlign: 'left',
                      border: activeSection === item.id ? '1px solid rgba(0, 212, 255, 0.4)' : '1px solid transparent',
                      background: activeSection === item.id ? 'rgba(0, 212, 255, 0.2)' : 'transparent',
                      color: activeSection === item.id ? 'rgb(103, 232, 249)' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      marginBottom: '0.25rem',
                    }}
                    onMouseEnter={(e) => { if (activeSection !== item.id) { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; } }}
                    onMouseLeave={(e) => { if (activeSection !== item.id) { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.background = 'transparent'; } }}
                  >
                    <svg style={{ width: '1.25rem', height: '1.25rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1 }}>
              {/* Profile Section */}
              {activeSection === 'profile' && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Profile Information</h2>

                  <div style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'linear-gradient(to bottom right, rgb(6, 182, 212), rgb(59, 130, 246))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                          {(userData?.name || userData?.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white' }}>{userData?.name || 'No name set'}</p>
                        <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>{userData?.email}</p>
                        <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.25rem' }}>
                          Joined {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Display Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your display name"
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none' }}
                      />
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Email</label>
                      <input
                        type="email"
                        value={userData?.email || ''}
                        disabled
                        style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.5)', cursor: 'not-allowed' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.3)', marginTop: '0.25rem' }}>Email cannot be changed</p>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))', color: 'white', fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Security Section */}
              {activeSection === 'security' && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Security</h2>

                  {isOAuthUser ? (
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <svg style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(96, 165, 250)' }} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <div>
                          <p style={{ color: 'rgb(96, 165, 250)', fontWeight: 500 }}>Signed in with Google</p>
                          <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>Password management is handled by Google</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleChangePassword}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          required
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none' }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password (min 8 characters)"
                          required
                          minLength={8}
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none' }}
                        />
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)', marginBottom: '0.5rem' }}>Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          required
                          style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white', outline: 'none' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={saving}
                        style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))', color: 'white', fontWeight: 600, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                      >
                        {saving ? 'Changing...' : 'Change Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Linked Accounts Section */}
              {activeSection === 'linked' && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Linked Accounts</h2>

                  {/* Riot Account */}
                  <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(248, 113, 113)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12.534 21.77l-1.09-2.81 10.52.54-.451 4.5zM15.06 0L.307 6.969 2.59 17.471H5.6l-.52-7.084 2.688-1.478.623 8.562h3.01l-.58-10.2 2.779-1.53.796 11.73h3.09l-.18-14.583z" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ color: 'white', fontWeight: 500 }}>Riot Games</p>
                          {userData?.riotGameName ? (
                            <p style={{ fontSize: '0.875rem', color: 'rgb(34, 211, 238)' }}>
                              {userData.riotGameName}#{userData.riotTagLine}
                              <span style={{ color: 'rgba(255, 255, 255, 0.3)', marginLeft: '0.5rem' }}>({userData.riotRegion?.toUpperCase()})</span>
                            </p>
                          ) : (
                            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>Not linked</p>
                          )}
                        </div>
                      </div>

                      {userData?.riotGameName ? (
                        <button
                          onClick={handleUnlinkRiot}
                          disabled={saving}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(239, 68, 68, 0.3)', background: 'transparent', color: 'rgb(248, 113, 113)', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.5 : 1 }}
                        >
                          Unlink
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push('/link-riot')}
                          style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'rgb(34, 211, 238)', cursor: 'pointer' }}
                        >
                          Link Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Google Account */}
                  {isOAuthUser && (
                    <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '3rem', height: '3rem', borderRadius: '0.5rem', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg style={{ width: '1.5rem', height: '1.5rem', color: 'rgb(96, 165, 250)' }} viewBox="0 0 24 24" fill="currentColor">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                        </div>
                        <div>
                          <p style={{ color: 'white', fontWeight: 500 }}>Google</p>
                          <p style={{ fontSize: '0.875rem', color: 'rgb(74, 222, 128)' }}>Connected</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subscription Section */}
              {activeSection === 'subscription' && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '1.5rem' }}>Subscription & Credits</h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'linear-gradient(to bottom right, rgba(6, 182, 212, 0.2), rgba(59, 130, 246, 0.2))', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>Current Plan</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', textTransform: 'capitalize' }}>
                        {userData?.subscriptionTier || 'Free'}
                      </p>
                    </div>
                    <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'linear-gradient(to bottom right, rgba(234, 179, 8, 0.2), rgba(249, 115, 22, 0.2))', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                      <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '0.25rem' }}>Available Credits</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>{userData?.credits || 0}</p>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                      Credits are used for AI-powered game analysis. Each analysis costs 1 credit.
                    </p>
                    <button
                      onClick={() => router.push('/pricing')}
                      style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'linear-gradient(to right, rgb(6, 182, 212), rgb(59, 130, 246))', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}
                    >
                      Get More Credits
                    </button>
                  </div>
                </div>
              )}

              {/* Danger Zone Section */}
              {activeSection === 'danger' && (
                <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(248, 113, 113)', marginBottom: '1.5rem' }}>Danger Zone</h2>

                  <div style={{ padding: '1rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Delete Account</h3>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '1rem' }}>
                      Once you delete your account, there is no going back. All your data, including game analyses and linked accounts, will be permanently deleted.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'rgb(248, 113, 113)', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0, 0, 0, 0.7)' }}>
          <div className="glass-card" style={{ padding: '1.5rem', maxWidth: '28rem', width: '100%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'rgb(248, 113, 113)', marginBottom: '1rem' }}>Delete Account</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '1rem' }}>
              Type <span style={{ color: 'rgb(248, 113, 113)', fontFamily: 'monospace', fontWeight: 700 }}>DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'white', marginBottom: '1rem', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'transparent', color: 'rgba(255, 255, 255, 0.7)', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== 'DELETE' || saving}
                style={{ flex: 1, padding: '0.75rem 1rem', borderRadius: '0.5rem', background: 'rgb(239, 68, 68)', border: 'none', color: 'white', fontWeight: 600, cursor: deleteConfirm !== 'DELETE' || saving ? 'not-allowed' : 'pointer', opacity: deleteConfirm !== 'DELETE' || saving ? 0.5 : 1 }}
              >
                {saving ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
