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
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  const getStyle = () => {
    if (type === 'success') {
      return { 
        bg: 'bg-green-500 border-green-500 text-green-700', 
        icon: <IoCheckmarkCircleOutline className="text-lg" /> 
      };
    }
    if (type === 'error') {
      return { 
        bg: 'bg-red-500 border-red-500 text-red-700', 
        icon: <IoCloseCircleOutline className="text-lg" /> 
      };
    }
    if (type === 'warning') {
      return { 
        bg: 'bg-orange-500 border-orange-500 text-orange-700', 
        icon: <IoWarningOutline className="text-lg" /> 
      };
    }
    return { 
      bg: 'bg-blue-500 border-blue-500 text-blue-700', 
      icon: <IoInformationCircleOutline className="text-lg" /> 
    };
  };

  const style = getStyle();

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-fadeIn ${style.bg} bg-opacity-10`}
      style={{ minWidth: '280px', maxWidth: '400px' }}
    >
      <span>{style.icon}</span>
      <span className="text-sm font-medium flex-1">{message}</span>
      <button 
        onClick={() => dispatch(hideToast())} 
        className="p-0.5 rounded hover:bg-black/5 transition-colors"
      >
        <IoCloseOutline className="text-base" />
      </button>
    </div>
  );
};

export default Toast;
