const db = require('../config/db');

async function getRevenueReport(req, res) {
  try {
    if (db.isPostgresConnected && db.pool) {
      const summaryRes = await db.pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('day', NOW()) THEN total_amount ELSE 0 END), 0) as today_revenue,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('day', NOW()) THEN 1 ELSE 0 END), 0) as today_orders,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN total_amount ELSE 0 END), 0) as month_revenue,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('month', NOW()) THEN 1 ELSE 0 END), 0) as month_orders,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('year', NOW()) THEN total_amount ELSE 0 END), 0) as year_revenue,
          COALESCE(SUM(CASE WHEN created_at >= date_trunc('year', NOW()) THEN 1 ELSE 0 END), 0) as year_orders,
          COALESCE(SUM(total_amount), 0) as all_time_revenue,
          COUNT(*) as all_time_orders
        FROM orders
      `);

      const dailyRes = await db.pool.query(`
        SELECT 
          TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as period_label,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN payment_method = 'TRANSFER' THEN total_amount ELSE 0 END) as transfer_revenue
        FROM orders
        GROUP BY period_label
        ORDER BY period_label DESC
        LIMIT 30
      `);

      const monthlyRes = await db.pool.query(`
        SELECT 
          TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as period_label,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN payment_method = 'TRANSFER' THEN total_amount ELSE 0 END) as transfer_revenue
        FROM orders
        GROUP BY period_label
        ORDER BY period_label DESC
        LIMIT 12
      `);

      const yearlyRes = await db.pool.query(`
        SELECT 
          TO_CHAR(date_trunc('year', created_at), 'YYYY') as period_label,
          COUNT(*) as order_count,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN payment_method = 'TRANSFER' THEN total_amount ELSE 0 END) as transfer_revenue
        FROM orders
        GROUP BY period_label
        ORDER BY period_label DESC
        LIMIT 5
      `);

      const topProductsRes = await db.pool.query(`
        SELECT 
          product_name,
          SUM(quantity) as total_qty,
          SUM(subtotal) as total_revenue
        FROM order_items
        GROUP BY product_name
        ORDER BY total_qty DESC
        LIMIT 5
      `);

      return res.json({
        success: true,
        summary: summaryRes.rows[0],
        daily: dailyRes.rows,
        monthly: monthlyRes.rows,
        yearly: yearlyRes.rows,
        topProducts: topProductsRes.rows,
      });
    }
  } catch (err) {
    console.warn('[Report PG Warning]:', err.message);
  }

  // TÍNH TOÁN DỰ PHÒNG TỪ LOCALSTATE
  const orders = db.localState.orders || [];
  const todayStr = new Date().toISOString().slice(0, 10);
  const thisMonthStr = new Date().toISOString().slice(0, 7);
  const thisYearStr = new Date().toISOString().slice(0, 4);

  let todayRev = 0, todayCount = 0;
  let monthRev = 0, monthCount = 0;
  let yearRev = 0, yearCount = 0;
  let allRev = 0, allCount = orders.length;

  const dailyMap = {};
  const monthlyMap = {};
  const yearlyMap = {};
  const productMap = {};

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

  res.json({
    success: true,
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
  });
}

module.exports = {
  getRevenueReport,
};
