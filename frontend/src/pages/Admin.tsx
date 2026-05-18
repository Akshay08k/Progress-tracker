import React, { useState, useEffect, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { showToast } from '../store/uiSlice';
import { Card } from '../components/UI/Card';
import {
  IoShieldOutline, IoMegaphoneOutline, IoTrashOutline,
  IoLockClosedOutline, IoLockOpenOutline, IoPeopleOutline
} from 'react-icons/io5';

interface AdminStats {
  totalUsers: number;
  tasksCreatedToday: number;
  tasksCreatedWeek: number;
  notificationsSent: number;
}

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  level: number;
  xp: number;
  streak: number;
  role: string;
  suspended?: boolean;
}

export const Admin: React.FC = () => {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  // Administrative States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Announcement Form States
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerActive, setBannerActive] = useState(false);
  const [announcementSubmitting, setAnnouncementSubmitting] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const fetchAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // 1. Fetch Stats
      const statsRes = await fetch(`${backendUrl}/api/admin/stats`, { headers });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      // 2. Fetch Users
      const usersRes = await fetch(`${backendUrl}/api/admin/users`, { headers });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      // 3. Fetch Active Announcement
      const annRes = await fetch(`${backendUrl}/api/admin/announcements`, { headers });
      if (annRes.ok) {
        const annData = await annRes.json();
        setBannerMessage(annData.message || '');
        setBannerActive(annData.active || false);
      }
    } catch (e: any) {
      console.error('Failed to load administrative records:', e);
      dispatch(showToast({ message: 'Error retrieving administrator data panels.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [token, backendUrl, dispatch]);

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token, fetchAdminData]);

  const handleUpdateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnnouncementSubmitting(true);

    try {
      const res = await fetch(`${backendUrl}/api/admin/announcements`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: bannerMessage,
          active: bannerActive
        })
      });

      if (res.ok) {
        dispatch(showToast({ message: 'Site-wide announcements updated!', type: 'success' }));
      } else {
        const errorData = await res.json();
        dispatch(showToast({ message: errorData.error || 'Failed to update announcements.', type: 'error' }));
      }
    } catch (err: any) {
      console.error(err);
      dispatch(showToast({ message: 'Announcement sync failed.', type: 'error' }));
    } finally {
      setAnnouncementSubmitting(false);
    }
  };

  const handleUserAction = async (targetUserId: string, action: 'suspend' | 'unsuspend' | 'delete') => {
    if (action === 'delete' && !window.confirm('Are you absolutely sure you want to permanently delete this user from authorization and database storage?')) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUserId,
          action
        })
      });

      if (res.ok) {
        dispatch(showToast({ message: `User action "${action}" completed successfully.`, type: 'success' }));
        // Reload list
        fetchAdminData();
      } else {
        const errData = await res.json();
        dispatch(showToast({ message: errData.error || 'Failed to execute user action.', type: 'error' }));
      }
    } catch (err) {
      console.error(err);
      dispatch(showToast({ message: 'User control request failed.', type: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-dashed border-accent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight uppercase font-mono-stats text-[#d85a30] flex items-center gap-2">
          <IoShieldOutline />
          <span>Admin Control Center</span>
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Push global announcements, audit system analytics, suspend accounts, and manage system states.
        </p>
      </div>

      {/* Global Analytics Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center" padding="p-4">
          <span className="text-[9px] font-bold text-text-secondary uppercase font-mono-stats">Total Users</span>
          <span className="text-xl font-bold text-accent font-mono-stats block mt-1">{stats?.totalUsers || 0}</span>
        </Card>

        <Card className="text-center" padding="p-4">
          <span className="text-[9px] font-bold text-text-secondary uppercase font-mono-stats">Tasks Created Today</span>
          <span className="text-xl font-bold text-green-500 font-mono-stats block mt-1">{stats?.tasksCreatedToday || 0}</span>
        </Card>

        <Card className="text-center" padding="p-4">
          <span className="text-[9px] font-bold text-text-secondary uppercase font-mono-stats">Weekly Tasks</span>
          <span className="text-xl font-bold text-[#d85a30] font-mono-stats block mt-1">{stats?.tasksCreatedWeek || 0}</span>
        </Card>

        <Card className="text-center" padding="p-4">
          <span className="text-[9px] font-bold text-text-secondary uppercase font-mono-stats">Alerts Sent</span>
          <span className="text-xl font-bold text-[#7f77dd] font-mono-stats block mt-1">{stats?.notificationsSent || 0}</span>
        </Card>
      </div>

      {/* Announcements Manager */}
      <Card stitched={true} padding="p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <IoMegaphoneOutline className="text-accent text-lg" />
          <h3 className="text-xs font-extrabold text-text-primary uppercase">Push Global Announcement</h3>
        </div>

        <form onSubmit={handleUpdateAnnouncement} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase mb-1 tracking-wide">
              Announcement Message
            </label>
            <input
              type="text"
              value={bannerMessage}
              onChange={(e) => setBannerMessage(e.target.value)}
              placeholder="E.g. System upgrade scheduled for tonight at 12 AM EST."
              className="w-full p-2.5 rounded-lg bg-background-primary border border-border-stitch text-xs text-text-primary placeholder-text-secondary/40 focus:outline-none focus:border-accent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bannerActive"
              checked={bannerActive}
              onChange={(e) => setBannerActive(e.target.checked)}
              className="rounded bg-background-primary border-border-stitch text-accent focus:ring-accent w-4 h-4 cursor-pointer"
            />
            <label htmlFor="bannerActive" className="text-xs font-bold text-text-secondary uppercase cursor-pointer select-none">
              Publish Banner Live On Client Screens
            </label>
          </div>

          <button
            type="submit"
            disabled={announcementSubmitting}
            className="bg-accent border border-white text-white font-extrabold text-xs px-6 py-2.5 rounded-lg uppercase tracking-wide shadow-orbital hover:shadow-floating active:scale-95 transition-all"
          >
            {announcementSubmitting ? 'Syncing...' : 'Sync Settings'}
          </button>
        </form>
      </Card>

      {/* Users management table */}
      <Card padding="p-6">
        <div className="mb-4 flex items-center gap-1.5">
          <IoPeopleOutline className="text-[#d85a30] text-lg" />
          <h3 className="text-xs font-extrabold text-text-primary uppercase">User Records Directory</h3>
        </div>

        <div className="overflow-x-auto border border-border-stitch rounded-xl">
          <table className="min-w-full divide-y divide-border-stitch/60 text-xs">
            <thead className="bg-background-primary">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-text-secondary uppercase font-mono-stats">Display Name</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary uppercase font-mono-stats">Email</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary uppercase font-mono-stats">Lvl / XP</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary uppercase font-mono-stats">Streak</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary uppercase font-mono-stats">Role</th>
                <th className="px-4 py-3 text-right font-bold text-text-secondary uppercase font-mono-stats">Suspended</th>
                <th className="px-4 py-3 text-right font-bold text-text-secondary uppercase font-mono-stats">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-stitch/40">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-background-primary/30 transition-colors">
                  <td className="px-4 py-3 font-semibold text-text-primary">{u.displayName}</td>
                  <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                  <td className="px-4 py-3 text-center font-mono-stats text-accent font-bold">
                    Lvl {u.level} / {u.xp} XP
                  </td>
                  <td className="px-4 py-3 text-center font-mono-stats text-red-500 font-bold">{u.streak} 🔥</td>
                  <td className="px-4 py-3 text-center uppercase">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-[#d85a30]/10 text-[#d85a30] border border-[#d85a30]/40' : 'bg-background-primary text-text-secondary border border-border-stitch'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-stats uppercase">
                    {u.suspended ? (
                      <span className="text-red-500 font-bold">YES</span>
                    ) : (
                      <span className="text-green-500 font-bold">NO</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2.5">
                    {u.suspended ? (
                      <button
                        onClick={() => handleUserAction(u.uid, 'unsuspend')}
                        className="p-1.5 rounded bg-green-500/10 text-green-500 hover:bg-green-500 hover:text-white border border-green-500/30 transition-all"
                        title="Unsuspend User"
                      >
                        <IoLockOpenOutline className="text-base" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserAction(u.uid, 'suspend')}
                        className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 transition-all"
                        title="Suspend User"
                      >
                        <IoLockClosedOutline className="text-base" />
                      </button>
                    )}

                    <button
                      onClick={() => handleUserAction(u.uid, 'delete')}
                      className="p-1.5 rounded bg-background-primary text-text-secondary hover:bg-red-600 hover:text-white border border-border-stitch hover:border-red-600 transition-all"
                      title="Permanently Delete User"
                    >
                      <IoTrashOutline className="text-base" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};

export default Admin;
