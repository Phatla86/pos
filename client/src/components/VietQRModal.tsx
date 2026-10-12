'use client';

import React, { useState } from 'react';
import { ShopSettings } from '@/types/pos';
import { generateVietQRUrl, formatVND } from '@/lib/vietqr';
import { X, CheckCircle, Copy, Check, QrCode } from 'lucide-react';

interface VietQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tableName: string;
  amount: number;
  settings: ShopSettings;
}

export function VietQRModal({
  isOpen,
  onClose,
  onConfirm,
  tableName,
  amount,
  settings,
}: VietQRModalProps) {
  const [copiedAcc, setCopiedAcc] = useState(false);
  const orderCode = 'HD' + Date.now().toString().slice(-6);

  if (!isOpen) return null;

  const qrUrl = generateVietQRUrl({
    bankId: settings.bank_id || 'MB',
    accountNo: settings.account_no || '868688286',
    accountName: settings.account_name || 'LA PHAT',
    amount,
    orderCode,
    template: settings.qr_template || 'compact2',
  });

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(settings.account_no || '868688286');
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-rose-800 to-rose-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Thanh Toán VietQR</h3>
              <p className="text-xs text-rose-100">
                {tableName} &bull; Mã đơn: #{orderCode}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* NỘI DUNG MÃ QR & THÔNG TIN CHUYỂN KHOẢN */}
        <div className="p-5 overflow-y-auto flex flex-col items-center">
          {/* TỔNG TIỀN */}
          <div className="text-center mb-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Số tiền cần thanh toán
            </span>
            <div className="text-3xl font-black text-rose-700 dark:text-rose-400">
              {formatVND(amount)}
            </div>
          </div>

          {/* MÃ QR VIETQR TỰ ĐỘNG SINH */}
          <div className="p-3 bg-white rounded-2xl border-2 border-rose-100 dark:border-rose-950 shadow-inner flex flex-col items-center max-w-[280px] w-full">
            <img
              src={qrUrl}
              alt="Mã VietQR Cafe Cherry"
              className="w-full h-auto rounded-lg"
            />
            <span className="text-[11px] text-slate-500 font-medium mt-2 text-center">
              Khách quét mã bằng App Ngân hàng bất kỳ
            </span>
          </div>

          {/* CHI TIẾT TÀI KHOẢN */}
          <div className="w-full mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Ngân hàng:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                {settings.bank_id || 'MB'} (Quân Đội)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {settings.account_no || '868688286'}
                </span>
                <button
                  onClick={handleCopyAccount}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                  title="Sao chép số tài khoản"
                >
                  {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
              <span className="font-bold text-slate-900 dark:text-white uppercase">
                {settings.account_name || 'LA PHAT'}
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 dark:text-slate-400">Nội dung CK:</span>
              <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                Thanh toan don {orderCode}
              </span>
            </div>
          </div>
        </div>

        {/* NÚT XÁC NHẬN */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={onConfirm}
            className="flex-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Xác nhận đã nhận tiền</span>
          </button>
        </div>
      </div>
    </div>
  );
}
