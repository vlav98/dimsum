import { useEffect, useState } from 'react';
import { errorMessage, getJson, mutate, type Guild } from '../../lib/api';
import type { DashboardData, User } from '../../types/dashboard';

export function useDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    async function load() {
      try {
        const response = await fetch('/api/me', { credentials: 'same-origin' });
        if (response.status === 401) {
          if (active) {
            setUser(null);
            setDashboard(null);
          }
          return;
        }
        if (!response.ok)
          throw new Error(`Could not load your profile (${response.status}).`);
        const profile: User = await response.json();
        if (active) setUser(profile);
        const [status, guilds, commands] = await Promise.all([
          getJson<DashboardData['status']>('/api/status'),
          getJson<Guild[]>('/api/guilds'),
          getJson<DashboardData['commands']>('/api/commands'),
        ]);
        if (active) setDashboard({ status, guilds, commands });
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function logout() {
    try {
      await mutate('/api/auth/logout', 'POST');
      setUser(null);
      setDashboard(null);
      window.location.hash = '#/';
    } catch (logoutError) {
      setError(errorMessage(logoutError));
    }
  }

  return {
    user,
    dashboard,
    loading,
    error,
    logout,
    refresh: () => setRefreshKey((key) => key + 1),
  };
}
