import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/authSlice';
import { toggleMobileDrawer } from '../../store/uiSlice';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import ThemeSelector from './ThemeSelector';
import {
  IoNotificationsOutline,
  IoMenuOutline,
  IoCloseOutline,
  IoLogOutOutline,
  IoPersonOutline,
} from 'react-icons/io5';

export const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { unreadCount } = useAppSelector((state) => state.notifications);
  const mobileDrawerOpen = useAppSelector((state) => state.ui.mobileDrawerOpen);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { path: '/dashboard', label: 'Habits' },
    { path: '/profile', label: 'Profile' },
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background-surface border-b border-border z-40">
      <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">

        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleMobileDrawer(!mobileDrawerOpen))}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-background-primary transition-all focus:outline-none"
          >
            {mobileDrawerOpen ? <IoCloseOutline className="text-2xl" /> : <IoMenuOutline className="text-2xl" />}
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-text-primary">
              Habit Tracker
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `
                relative h-full flex items-center text-sm font-medium transition-all
                ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}
              `}
            >
              {({ isActive }) => (
                <>
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent"></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => dispatch({ type: 'notifications/toggleNotificationsPanel' })}
            className="p-2 rounded-lg hover:bg-background-primary text-text-secondary hover:text-text-primary transition-all relative focus:outline-none"
            title="Notifications"
          >
            <IoNotificationsOutline className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent text-[9px] text-white rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Theme Selector */}
          <ThemeSelector />

          {/* Avatar Menu */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(!avatarOpen)}
              className="w-9 h-9 rounded-full bg-background-primary border border-border flex items-center justify-center overflow-hidden hover:border-accent transition-all focus:outline-none"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background-surface shadow-lg p-2 z-50">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <div className="text-sm font-medium text-text-primary truncate">{user?.displayName}</div>
                  <div className="text-xs text-text-secondary truncate">{user?.email}</div>
                </div>

                <button
                  onClick={() => { navigate('/profile'); setAvatarOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-background-primary hover:text-text-primary transition-all"
                >
                  <IoPersonOutline className="text-base" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-all border-t border-border mt-1 pt-2"
                >
                  <IoLogOutOutline className="text-base" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => dispatch(toggleMobileDrawer(false))}
        >
          <div
            className="w-64 h-full bg-background-surface border-r border-border p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                    <span className="text-white font-bold text-sm">H</span>
                  </div>
                  <span className="font-bold text-base text-text-primary">Habit Tracker</span>
                </div>
                <button
                  onClick={() => dispatch(toggleMobileDrawer(false))}
                  className="p-1 rounded-lg text-text-secondary hover:bg-background-primary"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => dispatch(toggleMobileDrawer(false))}
                    className={({ isActive }) => `
                      w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${isActive ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-background-primary hover:text-text-primary'}
                    `}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-background-primary border border-border flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary truncate">{user?.displayName}</div>
                  <div className="text-xs text-text-secondary truncate">{user?.email}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-all"
              >
                <IoLogOutOutline className="text-base" />
                <span>Logout</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
