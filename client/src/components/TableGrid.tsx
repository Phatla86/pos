'use client';

import React from 'react';
import { DiningTable } from '@/types/pos';
import { DEFAULT_TABLES } from '@/lib/defaults';
import { formatVND } from '@/lib/vietqr';
import { Users, Clock } from 'lucide-react';

interface TableGridProps {
  tables: DiningTable[];
  selectedTableId: number;
  onSelectTable: (id: number) => void;
}

export function TableGrid({ tables, selectedTableId, onSelectTable }: TableGridProps) {
  // BẢO VỆ TUYỆT ĐỐI: NẾU STATE BỊ RỖNG THÌ LUÔN FALLBACK VỀ 10 BÀN ĂN MẶC ĐỊNH
  const displayTables = (tables && tables.length > 0) ? tables : DEFAULT_TABLES;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Sơ Đồ 10 Bàn Ăn</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {displayTables.filter(t => t.status === 'occupied').length}/10 đang ngồi
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Chạm vào bàn để xem hoặc gọi thêm món
          </p>
        </div>
      </div>

      {/* 10 BÀN ĂN GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {displayTables.map(table => {
          const isSelected = table.id === selectedTableId;
          const isOccupied = table.status === 'occupied';
          const items = table.current_items || [];
          const totalAmount = items.reduce((sum, i) => sum + (i.unit_price || i.price || 0) * (i.quantity || i.qty || 1), 0);
          const totalQty = items.reduce((sum, i) => sum + (i.quantity || i.qty || 1), 0);

          return (
            <div
              key={table.id}
              onClick={() => onSelectTable(table.id)}
              className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none flex flex-col justify-between h-28 ${
                isSelected
                  ? 'border-rose-600 dark:border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 shadow-md ring-2 ring-rose-500/20'
                  : isOccupied
                  ? 'border-amber-300 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* HEADER BÀN */}
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                  {table.name}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isOccupied
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {isOccupied ? 'Có khách' : 'Trống'}
                </span>
              </div>

              {/* THÔNG TIN CHI TIẾT */}
              <div className="my-auto">
                {isOccupied ? (
                  <div>
                    <div className="font-bold text-sm text-rose-700 dark:text-rose-400 leading-tight">
                      {formatVND(totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{totalQty} món</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    Sẵn sàng đón khách
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                {isOccupied && table.start_time ? (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{new Date(table.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                ) : (
                  <span>Bàn #{table.id}</span>
                )}
                {isSelected && (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Đang chọn
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
