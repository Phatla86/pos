'use client';

import React, { useState, useEffect } from 'react';
import { Coffee, LayoutGrid, UtensilsCrossed, BarChart3, Settings, Moon, Sun, RefreshCw, Smartphone, X, Download, Share2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pos' | 'menu' | 'reports' | 'settings';
  setActiveTab: (tab: 'pos' | 'menu' | 'reports' | 'settings') => void;
  shopName: string;
  isConnected: boolean;
  statusText: string;
  onReconnect: () => void;
}

export function Header({
  activeTab,
  setActiveTab,
  shopName,
  isConnected,
  statusText,
  onReconnect,
}: HeaderProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Bắt sự kiện PWA Install trên Android/Chrome
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearInterval(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Mở modal hướng dẫn cho iPhone hoặc Android
      setShowInstallModal(true);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-rose-100 dark:border-slate-800 sticky top-0 z-30 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* LOGO & SHOP NAME */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-800 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-900/20">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                {shopName || 'Cafe Cherry'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800">
                PRO POS
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {timeStr} &bull; 10 Bàn Ăn
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pos')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'pos'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Bán Hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'menu'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Thực Đơn</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Doanh Thu</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cài Đặt</span>
          </button>
        </nav>

        {/* STATUS BADGE & ACTIONS */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* NÚT CÀI APP ĐIỆN THOẠI */}
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-900/20 active:scale-95 transition-all"
            title="Cài đặt ứng dụng vào điện thoại"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cài App</span>
          </button>

          {/* WEBSOCKET SYNC BADGE */}
          <div
            onClick={onReconnect}
            title="Bấm để kết nối lại"
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-all border ${
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 animate-pulse'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="hidden sm:inline font-mono">{statusText}</span>
            <RefreshCw className="w-3 h-3 ml-0.5 opacity-60 hover:opacity-100" />
          </div>

          {/* DARK MODE TOGGLE */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Đổi giao diện Sáng / Tối"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 px-4 py-2 flex justify-around">
        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeTab === 'pos' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span>Bán hàng</span>
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeTab === 'menu' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>Thực đơn</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeTab === 'reports' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span>Báo cáo</span>
        </button>
        <button
          onClick={handleInstallClick}
          className="flex flex-col items-center text-xs font-semibold text-rose-600"
        >
          <Smartphone className="w-5 h-5" />
          <span>Cài App</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center text-xs font-semibold ${
            activeTab === 'settings' ? 'text-rose-600' : 'text-slate-500'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span>Cài đặt</span>
        </button>
      </div>

      {/* MODAL HƯỚNG DẪN CÀI ĐẶT APP VÀO ĐIỆN THOẠI */}
      {showInstallModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowInstallModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-700 flex items-center justify-center text-white shadow-lg shadow-rose-900/20">
                <Coffee className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                  Cài Đặt App Cafe Cherry
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Mở như app thật &bull; Toàn màn hình &bull; Chạy 24/24
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              {/* DÀNH CHO IPHONE */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <span>🍎 Dành cho iPhone (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Mở link bằng trình duyệt <strong>Safari</strong> trên iPhone.</li>
                  <li>Bấm nút <strong>Chia sẻ</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-blue-500" /> (ở thanh dưới cùng Safari).</li>
                  <li>Cuộn xuống chọn <strong>"Thêm vào MH chính"</strong> (Add to Home Screen).</li>
                  <li>Bấm <strong>Thêm</strong> ở góc trên. Biểu tượng App Cafe Cherry sẽ xuất hiện trên màn hình nền iPhone!</li>
                </ol>
              </div>

              {/* DÀNH CHO ANDROID */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <span>🤖 Dành cho Android (Samsung, Xiaomi, Oppo...):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                  <li>Mở link bằng trình duyệt <strong>Chrome</strong>.</li>
                  <li>Bấm vào dấu <strong>3 chấm (⋮)</strong> ở góc trên bên phải.</li>
                  <li>Chọn <strong>"Cài đặt ứng dụng"</strong> hoặc <strong>"Thêm vào Màn hình chính"</strong>.</li>
                  <li>Bấm <strong>Cài đặt</strong> để App xuất hiện ngay trên màn hình điện thoại!</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstallModal(false)}
              className="w-full mt-5 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm shadow-md shadow-rose-900/20 transition-colors"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
