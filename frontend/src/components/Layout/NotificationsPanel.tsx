import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleNotificationsPanel, markAllAsRead, clearNotifications } from '../../store/notificationsSlice';
import { IoCloseOutline, IoCheckmarkDoneOutline, IoTrashOutline, IoShieldOutline, IoAlertCircleOutline, IoPeopleOutline } from 'react-icons/io5';

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
    if (type === 'streak_buddy') return <IoPeopleOutline className="text-accent text-lg" />;
    return <IoAlertCircleOutline className="text-accent text-lg" />;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
        onClick={() => dispatch(toggleNotificationsPanel())}
      ></div>

      <div className="absolute inset-y-0 right-0 max-w-sm w-full bg-background-surface border-l border-border flex flex-col shadow-lg z-50">
        
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold">Notifications</h3>
          <button
            onClick={() => dispatch(toggleNotificationsPanel())}
            className="p-1.5 rounded-lg hover:bg-background-primary transition-colors"
          >
            <IoCloseOutline className="text-xl" />
          </button>
        </div>

        {/* Toolbar */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-b border-border bg-background-primary/50 flex items-center justify-between text-xs">
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
            >
              <IoCheckmarkDoneOutline className="text-sm" />
              <span>Mark All Read</span>
            </button>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-text-secondary hover:text-red-500 transition-colors"
            >
              <IoTrashOutline className="text-sm" />
              <span>Clear All</span>
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6">
              <span className="text-4xl mb-2">📬</span>
              <h4 className="font-medium">No notifications</h4>
              <p className="text-xs text-text-secondary mt-1">You're all caught up!</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition-all ${
                  item.read ? 'bg-background-primary/30 border-border' : 'bg-background-primary border-accent/20'
                }`}
              >
                {!item.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full"></span>
                )}

                <div className="flex gap-2.5 items-start">
                  <div className="mt-0.5">{getIcon(item.type)}</div>
                  <div>
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{item.body}</p>
                    <span className="text-[10px] text-text-secondary/60 mt-2 block">
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
