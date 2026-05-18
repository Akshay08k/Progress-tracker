import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/authSlice';
import { toggleMobileDrawer, toggleFocusTimer } from '../../store/uiSlice';
import { toggleNotificationsPanel } from '../../store/notificationsSlice';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import ThemeSelector from './ThemeSelector';
import { 
  IoNotificationsOutline, 
  IoMenuOutline, 
  IoCloseOutline, 
  IoLogOutOutline,
  IoPersonOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline
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
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/challenges', label: 'Challenges' },
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
    <nav className="fixed top-0 left-0 right-0 h-16 bg-background-surface border-b border-border-stitch z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
        
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => dispatch(toggleMobileDrawer(!mobileDrawerOpen))}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-background-primary transition-all focus:outline-none"
          >
            {mobileDrawerOpen ? <IoCloseOutline className="text-2xl" /> : <IoMenuOutline className="text-2xl" />}
          </button>
          
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-accent border-2 border-double border-white flex items-center justify-center shadow-orbital animate-float-slow">
              <span className="text-white font-extrabold text-sm font-mono-stats">S</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-text-primary via-accent to-accent bg-clip-text text-transparent uppercase font-mono-stats">
              StitchXP
            </span>
          </div>
        </div>

        {/* Center: Desktop Nav Navigation */}
        <div className="hidden md:flex items-center gap-8 h-full">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) => `
                relative h-full flex items-center text-sm font-semibold tracking-wide transition-all duration-300
                ${isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'}
              `}
            >
              {({ isActive }) => (
                <>
                  <span>{link.label}</span>
                  {isActive && (
                    <span 
                      className="absolute bottom-0 left-0 w-full h-0.5 border-b-2 border-dashed border-accent animate-stitch-draw"
                      style={{ strokeDasharray: '4', strokeDashoffset: '4' }}
                    ></span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right: Actions Menu */}
        <div className="flex items-center gap-4">
          
          {/* Pomodoro Button */}
          <button
            onClick={() => dispatch(toggleFocusTimer(true))}
            className="p-2 rounded-full border border-border-stitch hover:bg-background-primary text-text-secondary hover:text-accent transition-all duration-200 focus:outline-none"
            title="Focus Timer"
          >
            <IoTimeOutline className="text-xl" />
          </button>

          {/* Notifications Trigger */}
          <button
            onClick={() => dispatch(toggleNotificationsPanel())}
            className="p-2 rounded-full border border-border-stitch hover:bg-background-primary text-text-secondary hover:text-accent transition-all duration-200 relative focus:outline-none"
            title="Notifications"
          >
            <IoNotificationsOutline className="text-xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-[10px] font-mono-stats text-white rounded-full flex items-center justify-center border-2 border-background-surface font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dynamic Theme Selection */}
          <ThemeSelector />

          {/* Avatar Menu Dropdown */}
          <div className="relative" ref={avatarRef}>
            <button
              onClick={() => setAvatarOpen(prev => !prev)}
              className="w-9 h-9 rounded-full bg-background-primary border border-border-stitch flex items-center justify-center overflow-hidden hover:border-accent hover:shadow-orbital transition-all focus:outline-none relative"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold font-mono-stats">
                  {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              {/* Level Ring Overlay */}
              <div className="absolute inset-0 border border-dashed border-accent/20 rounded-full animate-spin" style={{ animationDuration: '10s' }}></div>
            </button>

            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border-stitch bg-background-surface shadow-floating p-2 z-50">
                <div className="px-3 py-2 border-b border-border-stitch mb-1">
                  <div className="text-xs font-bold text-text-primary truncate">{user?.displayName}</div>
                  <div className="text-[10px] text-text-secondary truncate">{user?.email}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded font-mono-stats">
                      Lvl {user?.level}
                    </span>
                    <span className="text-[9px] text-text-secondary font-mono-stats">
                      {user?.xp} XP
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => { navigate('/profile'); setAvatarOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-text-secondary hover:bg-background-primary hover:text-text-primary transition-all"
                >
                  <IoPersonOutline className="text-sm" />
                  <span>Profile Settings</span>
                </button>

                {user?.role === 'admin' && (
                  <button
                    onClick={() => { navigate('/admin'); setAvatarOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[#d85a30] hover:bg-background-primary hover:text-text-primary transition-all font-semibold"
                  >
                    <IoShieldCheckmarkOutline className="text-sm" />
                    <span>Admin Control</span>
                  </button>
                )}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-all border-t border-border-stitch mt-1 pt-2"
                >
                  <IoLogOutOutline className="text-sm" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Drawer Overlay */}
      {mobileDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => dispatch(toggleMobileDrawer(false))}
        >
          <div 
            className="w-64 h-full bg-background-surface border-r border-border-stitch p-4 flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-border-stitch mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shadow-orbital">
                    <span className="text-white font-extrabold text-sm font-mono-stats">S</span>
                  </div>
                  <span className="font-extrabold text-base tracking-tight text-text-primary font-mono-stats">STITCHXP</span>
                </div>
                <button
                  onClick={() => dispatch(toggleMobileDrawer(false))}
                  className="p-1 rounded-lg text-text-secondary hover:bg-background-primary"
                >
                  <IoCloseOutline className="text-xl" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    onClick={() => dispatch(toggleMobileDrawer(false))}
                    className={({ isActive }) => `
                      w-full px-4 py-2.5 rounded-lg text-sm font-semibold transition-all
                      ${isActive ? 'bg-accent/10 text-accent border-l-4 border-accent' : 'text-text-secondary hover:bg-background-primary hover:text-text-primary'}
                    `}
                  >
                    {link.label}
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="border-t border-border-stitch pt-4">
              <div className="flex items-center gap-3 px-2 mb-4">
                <div className="w-10 h-10 rounded-full bg-background-primary border border-border-stitch flex items-center justify-center overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-accent/10 text-accent flex items-center justify-center font-bold">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-text-primary truncate">{user?.displayName}</div>
                  <div className="text-[9px] font-bold text-accent font-mono-stats uppercase">LEVEL {user?.level}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-all"
              >
                <IoLogOutOutline className="text-sm" />
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
