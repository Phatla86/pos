'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RevenueReportData, Order } from '@/types/pos';
import { formatVND } from '@/lib/vietqr';
import { BarChart3, Download, Trophy, RefreshCw } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const STORAGE_KEY = 'cafepos_fullstack_state_v1';

export function RevenueReports() {
  const [reportData, setReportData] = useState<RevenueReportData | null>(null);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [loading, setLoading] = useState<boolean>(true);

  // Tính toán báo cáo dự phòng từ lịch sử đơn hàng trong bộ nhớ nếu API chưa có sẵn
  const generateFallbackReport = useCallback(() => {
    let orders: Order[] = [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orders) orders = parsed.orders;
      }
    } catch {
      // Ignore
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const thisMonthStr = new Date().toISOString().slice(0, 7);
    const thisYearStr = new Date().toISOString().slice(0, 4);

    let todayRev = 0, todayCount = 0;
    let monthRev = 0, monthCount = 0;
    let yearRev = 0, yearCount = 0;
    let allRev = 0, allCount = orders.length;

    const dailyMap: Record<string, { count: number; total: number; cash: number; transfer: number }> = {};
    const monthlyMap: Record<string, { count: number; total: number; cash: number; transfer: number }> = {};
    const yearlyMap: Record<string, { count: number; total: number; cash: number; transfer: number }> = {};
    const productMap: Record<string, { qty: number; total: number }> = {};

    orders.forEach(o => {
      const date = (o.created_at || new Date().toISOString()).slice(0, 10);
      const month = date.slice(0, 7);
      const year = date.slice(0, 4);
      const amount = Number(o.total_amount || 0);
      const isCash = o.payment_method === 'CASH';

      allRev += amount;
      if (date === todayStr) { todayRev += amount; todayCount++; }
      if (month === thisMonthStr) { monthRev += amount; monthCount++; }
      if (year === thisYearStr) { yearRev += amount; yearCount++; }

      if (!dailyMap[date]) dailyMap[date] = { count: 0, total: 0, cash: 0, transfer: 0 };
      dailyMap[date].count++;
      dailyMap[date].total += amount;
      if (isCash) dailyMap[date].cash += amount; else dailyMap[date].transfer += amount;

      if (!monthlyMap[month]) monthlyMap[month] = { count: 0, total: 0, cash: 0, transfer: 0 };
      monthlyMap[month].count++;
      monthlyMap[month].total += amount;
      if (isCash) monthlyMap[month].cash += amount; else monthlyMap[month].transfer += amount;

      if (!yearlyMap[year]) yearlyMap[year] = { count: 0, total: 0, cash: 0, transfer: 0 };
      yearlyMap[year].count++;
      yearlyMap[year].total += amount;
      if (isCash) yearlyMap[year].cash += amount; else yearlyMap[year].transfer += amount;

      (o.items || []).forEach(item => {
        const pName = item.product_name || 'Món';
        if (!productMap[pName]) productMap[pName] = { qty: 0, total: 0 };
        productMap[pName].qty += (item.quantity || 1);
        productMap[pName].total += (item.subtotal || 0);
      });
    });

    const fallback: RevenueReportData = {
      summary: {
        today_revenue: todayRev,
        today_orders: todayCount,
        month_revenue: monthRev,
        month_orders: monthCount,
        year_revenue: yearRev,
        year_orders: yearCount,
        all_time_revenue: allRev,
        all_time_orders: allCount,
      },
      daily: Object.entries(dailyMap).map(([k, v]) => ({
        period_label: k,
        order_count: v.count,
        total_revenue: v.total,
        cash_revenue: v.cash,
        transfer_revenue: v.transfer,
      })).sort((a, b) => b.period_label.localeCompare(a.period_label)),
      monthly: Object.entries(monthlyMap).map(([k, v]) => ({
        period_label: k,
        order_count: v.count,
        total_revenue: v.total,
        cash_revenue: v.cash,
        transfer_revenue: v.transfer,
      })).sort((a, b) => b.period_label.localeCompare(a.period_label)),
      yearly: Object.entries(yearlyMap).map(([k, v]) => ({
        period_label: k,
        order_count: v.count,
        total_revenue: v.total,
        cash_revenue: v.cash,
        transfer_revenue: v.transfer,
      })).sort((a, b) => b.period_label.localeCompare(a.period_label)),
      topProducts: Object.entries(productMap).map(([k, v]) => ({
        product_name: k,
        total_qty: v.qty,
        total_revenue: v.total,
      })).sort((a, b) => b.total_qty - a.total_qty).slice(0, 5),
    };

    return fallback;
  }, []);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${API_BASE}/reports/revenue`, { signal: controller.signal })
        .then(r => r.json())
        .finally(() => clearTimeout(timeout));

      if (res.success && res.summary) {
        setReportData(res);
      } else {
        setReportData(generateFallbackReport());
      }
    } catch {
      // Backend offline hoặc lỗi -> Luôn luôn hiển thị báo cáo fallback từ đơn hàng đã lưu
      setReportData(generateFallbackReport());
    } finally {
      setLoading(false);
    }
  }, [generateFallbackReport]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExportCSV = () => {
    if (!reportData) return;
    const records = reportData[activePeriod] || [];
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFFThời Gian,Số Đơn Hàng,Tổng Doanh Thu (VNĐ),Tiền Mặt (VNĐ),Chuyển Khoản (VNĐ)\n';

    records.forEach(r => {
      csvContent += `${r.period_label},${r.order_count},${r.total_revenue},${r.cash_revenue},${r.transfer_revenue}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Doanh_Thu_${activePeriod.toUpperCase()}_CafeCherry.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const report = reportData || generateFallbackReport();
  const { summary, daily, monthly, yearly, topProducts } = report;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-rose-700 dark:text-rose-400" />
            <span>Báo Cáo Doanh Thu (Ngày &bull; Tháng &bull; Năm)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Tổng hợp dữ liệu bán hàng & tỷ trọng thanh toán Tiền mặt / VietQR
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            title="Làm mới báo cáo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất File Excel / CSV</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS (HÔM NAY - THÁNG NÀY - NĂM NAY - TOÀN THỜI GIAN) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Doanh thu Hôm nay
          </span>
          <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-400 mt-1">
            {formatVND(Number(summary.today_revenue))}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {summary.today_orders} đơn hàng
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Doanh thu Tháng này
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatVND(Number(summary.month_revenue))}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {summary.month_orders} đơn hàng
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Doanh thu Năm nay
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatVND(Number(summary.year_revenue))}
          </div>
          <div className="text-xs text-slate-400 mt-1 font-medium">
            {summary.year_orders} đơn hàng
          </div>
        </div>

        <div className="bg-gradient-to-tr from-rose-800 to-rose-700 text-white p-4 rounded-2xl shadow-sm">
          <span className="text-xs font-semibold text-rose-200">
            Tổng Doanh Thu Toàn Bộ
          </span>
          <div className="text-xl sm:text-2xl font-black text-white mt-1">
            {formatVND(Number(summary.all_time_revenue))}
          </div>
          <div className="text-xs text-rose-200 mt-1 font-medium">
            {summary.all_time_orders} đơn hoàn tất
          </div>
        </div>
      </div>

      {/* TOP MÓN BÁN CHẠY */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Top Món Bán Chạy Nhất</span>
        </h3>
        {topProducts.length === 0 ? (
          <div className="text-xs text-slate-400 py-3">Chưa có dữ liệu đơn hàng hoàn tất. Hãy thực hiện gọi món và thanh toán bàn để xem thống kê.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {topProducts.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="text-xs text-rose-600 font-extrabold">#{idx + 1}</div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                  {p.product_name}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{p.total_qty} ly</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{formatVND(Number(p.total_revenue))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BẢNG CHI TIẾT THEO KỲ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* TABS CHỌN KỲ: NGÀY / THÁNG / NĂM */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActivePeriod('daily')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              📅 Theo Ngày ({daily.length})
            </button>
            <button
              onClick={() => setActivePeriod('monthly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🗓️ Theo Tháng ({monthly.length})
            </button>
            <button
              onClick={() => setActivePeriod('yearly')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePeriod === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              📈 Theo Năm ({yearly.length})
            </button>
          </div>
        </div>

        {/* BẢNG SỐ LIỆU */}
        <div className="overflow-x-auto">
          {daily.length === 0 && monthly.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">Chưa có đơn hàng nào được ghi nhận.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Thời Gian</th>
                  <th className="py-3.5 px-4 text-center">Số Lượng Đơn</th>
                  <th className="py-3.5 px-4 text-right">Tiền Mặt 💵</th>
                  <th className="py-3.5 px-4 text-right">Chuyển Khoản (VietQR) 💳</th>
                  <th className="py-3.5 px-4 text-right">Tổng Doanh Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(report[activePeriod] || []).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {row.period_label}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                      {row.order_count}
                    </td>
                    <td className="py-3 px-4 text-right text-emerald-600 font-medium">
                      {formatVND(Number(row.cash_revenue))}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600 font-medium">
                      {formatVND(Number(row.transfer_revenue))}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-700 dark:text-rose-400 text-base">
                      {formatVND(Number(row.total_revenue))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
