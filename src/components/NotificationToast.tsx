import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Bell, X, Sparkles, Truck, CheckCircle2 } from 'lucide-react';

export const NotificationToast: React.FC = () => {
  const { 
    notifications, 
    markNotificationAsRead, 
    setIsOrderTrackingOpen,
    requestBrowserPushPermission 
  } = useStore();

  const [activeToast, setActiveToast] = useState<string | null>(null);
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);

  // Monitor latest unread notification
  useEffect(() => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length > 0) {
      const latest = unread[0];
      setActiveToast(latest.id);
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  // Show push notification permission banner after initial 3 seconds if not prompted yet
  useEffect(() => {
    const dismissed = sessionStorage.getItem('saena_push_dismissed');
    if (!dismissed && 'Notification' in window && Notification.permission === 'default') {
      const timer = setTimeout(() => {
        setShowPermissionBanner(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissBanner = () => {
    setShowPermissionBanner(false);
    sessionStorage.setItem('saena_push_dismissed', 'true');
  };

  const handleEnablePush = async () => {
    await requestBrowserPushPermission();
    setShowPermissionBanner(false);
  };

  const toastItem = notifications.find(n => n.id === activeToast);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      
      {/* Push Permission Prompt Banner */}
      {showPermissionBanner && (
        <div className="pointer-events-auto bg-[#1C3B2B] text-white p-4 rounded-2xl shadow-2xl border border-[#C5A880]/30 animate-in slide-in-from-bottom-5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#C5A880]/20 flex items-center justify-center text-[#C5A880]">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold">Aktifkan Notifikasi saena.id</h4>
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-white/60 hover:text-white p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-[#D8CFBF] mt-1.5 leading-relaxed">
            Dapatkan info nomor resi otomatis, status pengiriman langsung di layar, & flash sale busana muslim.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnablePush}
              className="flex-1 py-1.5 bg-[#C5A880] text-[#1C3B2B] text-xs font-bold rounded-lg hover:bg-[#D4BA95] transition-colors"
            >
              Izinkan
            </button>
            <button
              onClick={handleDismissBanner}
              className="px-3 py-1.5 bg-white/10 text-white text-xs font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              Nanti
            </button>
          </div>
        </div>
      )}

      {/* Floating Push Notification Toast */}
      {toastItem && (
        <div 
          onClick={() => {
            markNotificationAsRead(toastItem.id);
            if (toastItem.linkTarget) {
              setIsOrderTrackingOpen(true);
            }
            setActiveToast(null);
          }}
          className="pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl border border-[#E5DDD2] cursor-pointer hover:border-[#1C3B2B] transition-all animate-in slide-in-from-right duration-300"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1C3B2B]/10 text-[#1C3B2B] flex items-center justify-center">
                {toastItem.type === 'order' ? (
                  <Truck className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#B38F5B]" />
                )}
              </div>
              <h5 className="text-xs font-bold text-[#1C3B2B]">{toastItem.title}</h5>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveToast(null);
                markNotificationAsRead(toastItem.id);
              }}
              className="text-[#9E9588] hover:text-black"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-[#4A453E] mt-1 pl-8 leading-snug">
            {toastItem.message}
          </p>
          <span className="text-[10px] text-[#8C8377] block text-right mt-1 font-medium">
            Ketuk untuk melihat detail
          </span>
        </div>
      )}

    </div>
  );
};
