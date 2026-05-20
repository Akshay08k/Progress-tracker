import React, { useState, useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { setTheme, type ThemeType } from '../../store/themeSlice';
import { IoColorPaletteOutline } from 'react-icons/io5';

export const ThemeSelector: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector((state) => state.theme.currentTheme);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { id: ThemeType; name: string; preview: string }[] = [
    { id: 'light', name: 'Light', preview: 'bg-white border border-gray-200' },
    { id: 'dark', name: 'Dark', preview: 'bg-slate-900' },
    { id: 'forest', name: 'Forest', preview: 'bg-green-900' },
    { id: 'ocean', name: 'Ocean', preview: 'bg-sky-900' },
    { id: 'sunset', name: 'Sunset', preview: 'bg-orange-900' },
    { id: 'rose', name: 'Rose', preview: 'bg-rose-900' },
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
        className="p-2 rounded-lg hover:bg-background-primary text-text-secondary hover:text-text-primary transition-all focus:outline-none"
        title="Switch Theme"
      >
        <IoColorPaletteOutline className="text-xl" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-background-surface shadow-lg p-2 z-50">
          <div className="text-xs font-medium text-text-secondary px-3 py-1.5 uppercase tracking-wide">
            Theme
          </div>
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                dispatch(setTheme(t.id));
                setOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition-all
                ${currentTheme === t.id ? 'bg-accent/10 text-accent font-medium' : 'text-text-secondary hover:bg-background-primary hover:text-text-primary'}
              `}
            >
              <span className={`w-4 h-4 rounded-full ${t.preview}`}></span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
