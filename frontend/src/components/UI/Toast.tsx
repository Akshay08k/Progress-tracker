import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { hideToast } from '../../store/uiSlice';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoInformationCircleOutline, IoWarningOutline, IoCloseOutline } from 'react-icons/io5';

export const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { message, type, visible } = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  const getStyle = () => {
    if (type === 'success') {
      return { 
        bg: 'bg-green-500/10 border-green-500/40 text-green-500', 
        icon: <IoCheckmarkCircleOutline className="text-lg" /> 
      };
    }
    if (type === 'error') {
      return { 
        bg: 'bg-red-500/10 border-red-500/40 text-red-500', 
        icon: <IoCloseCircleOutline className="text-lg" /> 
      };
    }
    if (type === 'warning') {
      return { 
        bg: 'bg-orange-500/10 border-orange-500/40 text-orange-500', 
        icon: <IoWarningOutline className="text-lg" /> 
      };
    }
    return { 
      bg: 'bg-blue-500/10 border-blue-500/40 text-blue-500', 
      icon: <IoInformationCircleOutline className="text-lg" /> 
    };
  };

  const style = getStyle();

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-floating
        animate-slideIn ${style.bg}
      `}
      style={{ minWidth: '280px' }}
    >
      <span>{style.icon}</span>
      <span className="text-xs font-semibold flex-1 leading-snug">{message}</span>
      <button 
        onClick={() => dispatch(hideToast())} 
        className="p-0.5 rounded text-current hover:bg-black/5 focus:outline-none"
      >
        <IoCloseOutline className="text-base" />
      </button>
    </div>
  );
};

export default Toast;
