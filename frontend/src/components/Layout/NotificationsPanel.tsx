import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleNotificationsPanel, markAllAsRead, clearNotifications } from '../../store/notificationsSlice';
import { IoCloseOutline, IoCheckmarkDoneOutline, IoTrashOutline, IoShieldOutline, IoAlertCircleOutline, IoRibbonOutline } from 'react-icons/io5';

export const NotificationsPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications: items, panelOpen } = useAppSelector((state) => state.notifications);

  if (!panelOpen) return null;

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleClearAll = () => {
    dispatch(clearNotifications());
  };

  const getIcon = (type?: string) => {
    if (type === 'security_ip') return <IoShieldOutline className="text-red-500 text-lg" />;
    if (type === 'challenge') return <IoRibbonOutline className="text-yellow-500 text-lg" />;
    return <IoAlertCircleOutline className="text-accent text-lg" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={() => dispatch(toggleNotificationsPanel())}
      ></div>

      {/* Slider container */}
      <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-background-surface border-l border-border-stitch flex flex-col shadow-floating z-50 animate-slideIn">
        
        {/* Header */}
        <div className="p-4 border-b border-border-stitch flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold tracking-wider text-accent uppercase font-mono-stats">INBOX PANEL</span>
            <h3 className="text-sm font-bold text-text-primary uppercase">Notifications</h3>
          </div>
          <button
            onClick={() => dispatch(toggleNotificationsPanel())}
            className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-background-primary transition-all focus:outline-none"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Toolbar controls */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-b border-border-stitch bg-background-primary/40 flex items-center justify-between text-[10px]">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 font-bold text-text-secondary hover:text-accent uppercase font-mono-stats"
            >
              <IoCheckmarkDoneOutline className="text-xs" />
              <span>Mark All Read</span>
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 font-bold text-text-secondary hover:text-red-500 uppercase font-mono-stats"
            >
              <IoTrashOutline className="text-xs" />
              <span>Purge All</span>
            </button>
          </div>
        )}

        {/* Notifications list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-border-stitch rounded-xl">
              <span className="text-4xl filter grayscale mb-2">📬</span>
              <h4 className="text-xs font-bold text-text-primary uppercase font-mono-stats">Clear Horizon</h4>
              <p className="text-[10px] text-text-secondary mt-1">
                Your focus canvas is completely clean. No pending alerts.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`
                  p-3 rounded-lg border text-left transition-all relative overflow-hidden
                  ${item.read ? 'bg-background-primary/30 border-border-stitch/60 text-text-secondary' : 'bg-background-primary border-accent/30 text-text-primary'}
                `}
              >
                {/* Active indicator bead */}
                {!item.read && (
                  <span className="absolute top-3 right-3 w-1.5 h-1.5 bg-accent rounded-full animate-ping"></span>
                )}

                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-tight">{item.title}</h4>
                    <p className="text-[10px] text-text-secondary leading-normal mt-1">{item.body}</p>
                    <span className="text-[8px] font-mono-stats text-text-secondary/60 mt-2 block">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default NotificationsPanel;
