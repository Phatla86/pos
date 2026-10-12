'use client';

import React, { useState } from 'react';
import { DiningTable, TableItem } from '@/types/pos';
import { formatVND } from '@/lib/vietqr';
import { Trash2, Plus, Minus, Edit3, ArrowRightLeft, QrCode, Banknote, Coffee } from 'lucide-react';

interface OrderPanelProps {
  currentTable: DiningTable;
  currentTotal: number;
  onUpdateQty: (index: number, delta: number) => void;
  onUpdateNote: (index: number, notes: string) => void;
  onClearTable: () => void;
  onOpenTransferModal: () => void;
  onPayCash: () => void;
  onPayVietQR: () => void;
}

export function OrderPanel({
  currentTable,
  currentTotal,
  onUpdateQty,
  onUpdateNote,
  onClearTable,
  onOpenTransferModal,
  onPayCash,
  onPayVietQR,
}: OrderPanelProps) {
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [tempNote, setTempNote] = useState<string>('');

  const items = currentTable.current_items || [];
  const hasItems = items.length > 0;

  const handleOpenNoteModal = (index: number, currentNote?: string) => {
    setEditingNoteIndex(index);
    setTempNote(currentNote || '');
  };

  const handleSaveNote = () => {
    if (editingNoteIndex !== null) {
      onUpdateNote(editingNoteIndex, tempNote);
      setEditingNoteIndex(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full justify-between">
      {/* HEADER BÀN */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                {currentTable.name}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  currentTable.status === 'occupied'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                }`}
              >
                {currentTable.status === 'occupied' ? 'Đang phục vụ' : 'Bàn trống'}
              </span>
            </div>
            {currentTable.start_time && (
              <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Vào bàn lúc: {new Date(currentTable.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {/* ACTIONS: CHUYỂN BÀN & DỌN BÀN */}
          {hasItems && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenTransferModal}
                title="Chuyển hoặc gộp bàn"
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Chuyển</span>
              </button>
              <button
                onClick={onClearTable}
                title="Dọn toàn bộ bàn"
                className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* DANH SÁCH MÓN ĐÃ GỌI */}
        <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
          {!hasItems ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center">
              <Coffee className="w-10 h-10 mb-2 stroke-1 opacity-40 text-rose-400" />
              <p className="text-sm font-semibold">Bàn chưa có món nào</p>
              <p className="text-xs mt-0.5">Bấm chọn đồ uống ở thực đơn bên trái để gọi món</p>
            </div>
          ) : (
            items.map((item, index) => {
              const unitPrice = item.unit_price || item.price || 0;
              const qty = item.quantity || item.qty || 1;
              const subtotal = unitPrice * qty;

              return (
                <div key={index} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.product_name || item.name}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{formatVND(unitPrice)}</span>
                      {item.notes ? (
                        <span
                          onClick={() => handleOpenNoteModal(index, item.notes)}
                          className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer truncate max-w-[120px]"
                        >
                          📝 {item.notes}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenNoteModal(index)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
                        >
                          + Ghi chú
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SỐ LƯỢNG +/- */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => onUpdateQty(index, -1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs text-slate-800 dark:text-slate-100">
                      {qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(index, 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* THÀNH TIỀN */}
                  <div className="w-20 text-right font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {formatVND(subtotal)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* FOOTER THANH TOÁN */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-400">
            TỔNG TIỀN ({items.length} món):
          </span>
          <span className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 tracking-tight">
            {formatVND(currentTotal)}
          </span>
        </div>

        {/* NÚT THANH TOÁN */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            disabled={!hasItems}
            onClick={onPayCash}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition-all"
          >
            <Banknote className="w-4 h-4" />
            <span>Tiền Mặt</span>
          </button>

          <button
            disabled={!hasItems}
            onClick={onPayVietQR}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-800 hover:to-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-rose-900/20 active:scale-98 transition-all"
          >
            <QrCode className="w-4 h-4" />
            <span>Quét VietQR</span>
          </button>
        </div>
      </div>

      {/* MODAL GHI CHÚ MÓN */}
      {editingNoteIndex !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h4 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Ghi chú cho món: {items[editingNoteIndex]?.product_name || items[editingNoteIndex]?.name}
            </h4>
            <div className="flex gap-2 flex-wrap mb-3">
              {['Ít ngọt', 'Không đường', 'Ít đá', 'Nhiều đá', 'Không sữa'].map(quickNote => (
                <button
                  key={quickNote}
                  onClick={() => setTempNote(quickNote)}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-700"
                >
                  {quickNote}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="VD: Ít sữa, không đá, mang đi..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm mb-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingNoteIndex(null)}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm"
              >
                Lưu ghi chú
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
