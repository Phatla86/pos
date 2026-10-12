'use client';

import React, { useState } from 'react';
import { DiningTable } from '@/types/pos';
import { X, ArrowRightLeft, Merge } from 'lucide-react';

interface TransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTable: DiningTable;
  tables: DiningTable[];
  onTransfer: (targetTableId: number, mode: 'MOVE' | 'MERGE') => void;
}

export function TransferTableModal({
  isOpen,
  onClose,
  currentTable,
  tables,
  onTransfer,
}: TransferTableModalProps) {
  const [targetId, setTargetId] = useState<number>(
    tables.find(t => t.id !== currentTable.id)?.id || 1
  );
  const [mode, setMode] = useState<'MOVE' | 'MERGE'>('MOVE');

  if (!isOpen) return null;

  const targetTable = tables.find(t => t.id === targetId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTransfer(targetId, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Chuyển / Gộp Bàn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Bàn nguồn (Đang có {currentTable.current_items?.length || 0} món):
            </label>
            <div className="mt-1 p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl font-bold text-sm text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              {currentTable.name}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Chuyển sang bàn đích:
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(Number(e.target.value))}
              className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            >
              {tables
                .filter(t => t.id !== currentTable.id)
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.status === 'occupied' ? 'Đang có khách' : 'Trống'})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Hình thức chuyển:
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setMode('MOVE')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'MOVE'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Chuyển bàn (Đổi chỗ)</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('MERGE')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'MERGE'
                    ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Merge className="w-3.5 h-3.5" />
                <span>Gộp bàn (Cộng món)</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-sm font-bold shadow-md shadow-rose-900/20"
            >
              Xác nhận
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
