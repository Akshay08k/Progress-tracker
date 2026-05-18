import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setTheme, type ThemeType } from '../../store/themeSlice';
import { IoColorPaletteOutline } from 'react-icons/io5';

export const ThemeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { id: ThemeType; name: string; color: string }[] = [
    { id: 'dark-void', name: 'Dark Void', color: 'bg-[#534AB7]' },
    { id: 'light-canvas', name: 'Light Canvas', color: 'bg-[#1A1A1A]' },
    { id: 'forest-green', name: 'Forest Green', color: 'bg-[#1D9E75]' },
    { id: 'midnight-purple', name: 'Midnight Purple', color: 'bg-[#7F77DD]' },
    { id: 'ember-orange', name: 'Ember Orange', color: 'bg-[#D85A30]' },
    { id: 'arctic-frost', name: 'Arctic Frost', color: 'bg-[#378ADD]' },
  ];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full border border-border-stitch hover:bg-background-primary text-text-secondary hover:text-accent transition-all duration-200 focus:outline-none"
        title="Switch Theme"
      >
        <IoColorPaletteOutline className="text-xl" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border-stitch bg-background-surface shadow-floating p-2 z-50">
          <div className="text-[10px] font-bold text-text-secondary/60 px-3 py-1 uppercase tracking-wider mb-1">
            Choose Canvas
          </div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                dispatch(setTheme(t.id));
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-left
                ${currentTheme === t.id ? 'bg-background-primary text-accent font-bold border-l-2 border-accent' : 'text-text-secondary hover:bg-background-primary hover:text-text-primary'}
                transition-all duration-200
              `}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${t.color} border border-border-stitch`}></span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
