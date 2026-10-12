'use client';

import React, { useState } from 'react';
import { ShopSettings } from '@/types/pos';
import { Settings, Store, CreditCard, Mail, Radio, Save, Send, Eye, EyeOff } from 'lucide-react';

interface SettingsViewProps {
  settings: ShopSettings;
  onSaveSettings: (newSettings: ShopSettings) => void;
  wsUrl: string;
  onSetWsUrl: (url: string) => void;
  onReconnectWs: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export function SettingsView({
  settings,
  onSaveSettings,
  wsUrl,
  onSetWsUrl,
  onReconnectWs,
}: SettingsViewProps) {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [showPass, setShowPass] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof ShopSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      }).then(r => r.json());

      if (res.success) {
        onSaveSettings(res.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API_BASE}/settings/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: formData.email_method,
          sender_email: formData.sender_email,
          sender_password: formData.sender_password,
          resend_api_key: formData.resend_api_key,
          receiver_email: formData.receiver_email,
        }),
      }).then(r => r.json());

      setTestResult(res.message);
    } catch (err: any) {
      setTestResult('Lỗi gửi email: ' + err.message);
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-rose-700 dark:text-rose-400" />
            <span>Cài Đặt Hệ Thống POS & Đồng Bộ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý thông tin quán, VietQR, gửi hóa đơn Gmail và cấu hình máy chủ
          </p>
        </div>

        {saveSuccess && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200">
            ✓ Đã lưu cài đặt!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. THÔNG TIN QUÁN CAFE */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Store className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Thông Tin Quán & Hóa Đơn
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Tên Quán:</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Số Điện Thoại:</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Địa Chỉ Quán:</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Lời Chúc Chân Trang:</label>
              <input
                type="text"
                value={formData.footer || ''}
                onChange={(e) => handleChange('footer', e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        </div>

        {/* 2. CẤU HÌNH TÀI KHOẢN VIETQR */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <CreditCard className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Cấu Hình Tài Khoản VietQR (Nhận Tiền Tự Động)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Mã Ngân Hàng:</label>
              <select
                value={formData.bank_id || 'MB'}
                onChange={(e) => handleChange('bank_id', e.target.value)}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="MB">MBBank (Quân Đội)</option>
                <option value="VCB">Vietcombank</option>
                <option value="TCB">Techcombank</option>
                <option value="ACB">ACB</option>
                <option value="VPB">VPBank</option>
                <option value="TPB">TPBank</option>
                <option value="ICB">VietinBank</option>
                <option value="BIDV">BIDV</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Số Tài Khoản:</label>
              <input
                type="text"
                value={formData.account_no || ''}
                onChange={(e) => handleChange('account_no', e.target.value)}
                placeholder="VD: 868688286"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Tên Chủ Tài Khoản:</label>
              <input
                type="text"
                value={formData.account_name || ''}
                onChange={(e) => handleChange('account_name', e.target.value.toUpperCase())}
                placeholder="VD: LA PHAT"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-extrabold text-slate-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          </div>
        </div>

        {/* 3. CẤU HÌNH GMAIL THÔNG BÁO ĐƠN HÀNG */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-rose-600" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Gửi Hóa Đơn & Báo Cáo Về Gmail
              </h3>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Bật thông báo:</span>
              <input
                type="checkbox"
                checked={formData.email_enabled}
                onChange={(e) => handleChange('email_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Phương thức gửi:</label>
                <select
                  value={formData.email_method}
                  onChange={(e) => handleChange('email_method', e.target.value as any)}
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <option value="GMAIL_SMTP">Gmail SMTP (Cổng 465)</option>
                  <option value="RESEND_API">Resend API (Cổng 443 - Khuyên dùng khi deploy Cloud)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Email Người Nhận Báo Cáo:</label>
                <input
                  type="email"
                  value={formData.receiver_email || ''}
                  onChange={(e) => handleChange('receiver_email', e.target.value)}
                  placeholder="chuquan@gmail.com"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {formData.email_method === 'GMAIL_SMTP' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Địa chỉ Gmail gửi:</label>
                  <input
                    type="email"
                    value={formData.sender_email || ''}
                    onChange={(e) => handleChange('sender_email', e.target.value)}
                    placeholder="quanpos@gmail.com"
                    className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Mật khẩu ứng dụng (16 chữ cái):</label>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={formData.sender_password || ''}
                    onChange={(e) => handleChange('sender_password', e.target.value)}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="mt-1 w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Resend API Key:</label>
                <input
                  type="text"
                  value={formData.resend_api_key || ''}
                  onChange={(e) => handleChange('resend_api_key', e.target.value)}
                  placeholder="re_xxxxxxxxxxxxxx"
                  className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                disabled={testingEmail}
                onClick={handleTestEmail}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{testingEmail ? 'Đang gửi thử...' : 'Gửi email thử nghiệm'}</span>
              </button>

              {testResult && (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {testResult}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 4. MÁY CHỦ WEBSOCKET (ĐỒNG BỘ ZALO & MÁY TÍNH) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <Radio className="w-5 h-5 text-rose-600" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Đồng Bộ Thời Gian Thực (WebSocket Realtime)
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Địa chỉ Máy chủ WebSocket:
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={wsUrl}
                  onChange={(e) => onSetWsUrl(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={onReconnectWs}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-white text-xs font-bold"
                >
                  Kết nối lại
                </button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap pt-1">
              <button
                type="button"
                onClick={() => {
                  onSetWsUrl('wss://pos-qhih.onrender.com/ws');
                  onReconnectWs();
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold"
              >
                🌐 Dùng Cloud Render (pos-qhih.onrender.com)
              </button>
              <button
                type="button"
                onClick={() => {
                  onSetWsUrl('ws://localhost:8080/ws');
                  onReconnectWs();
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-bold"
              >
                💻 Dùng Localhost (ws://localhost:8080/ws)
              </button>
            </div>
          </div>
        </div>

        {/* NÚT LƯU CẤU HÌNH TỔNG */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-extrabold text-sm shadow-md shadow-rose-900/20 active:scale-98 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cấu Hình</span>
          </button>
        </div>
      </form>
    </div>
  );
}
