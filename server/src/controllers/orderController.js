const db = require('../config/db');
const { broadcast } = require('../services/socketService');
const { generateOrderEmailHtml, dispatchEmail } = require('../services/emailService');

// Lấy danh sách lịch sử đơn hàng
async function getOrders(req, res) {
  try {
    if (db.isPostgresConnected && db.pool) {
      const ordersRes = await db.pool.query(
        `SELECT o.*, 
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'subtotal', oi.subtotal,
              'notes', oi.notes
            )
          ) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT 50`
      );
      if (ordersRes.rows && ordersRes.rows.length > 0) {
        return res.json({ success: true, orders: ordersRes.rows });
      }
    }
  } catch (err) {
    console.warn('[Orders PG Error]:', err.message);
  }

  res.json({ success: true, orders: db.localState.orders || [] });
}

// Thanh toán đơn hàng
async function createOrder(req, res) {
  const { table_id, items, total_amount, payment_method, notes } = req.body;

  if (!table_id || !items || items.length === 0 || total_amount == null) {
    return res.status(400).json({ success: false, message: 'Dữ liệu đơn hàng không đầy đủ' });
  }

  const orderCode = 'HD' + Date.now().toString().slice(-6);
  const nowStr = new Date().toISOString();

  // 1. Tạo bản ghi đơn hàng
  const newOrder = {
    id: Date.now(),
    order_code: orderCode,
    table_id: Number(table_id),
    table_name: `Bàn ${table_id}`,
    total_amount: Number(total_amount),
    payment_method: payment_method || 'CASH',
    status: 'COMPLETED',
    notes: notes || null,
    created_at: nowStr,
    items: items.map(item => ({
      product_name: item.product_name || item.name || 'Món',
      quantity: item.quantity || item.qty || 1,
      unit_price: item.unit_price || item.price || 0,
      subtotal: (item.unit_price || item.price || 0) * (item.quantity || item.qty || 1),
      notes: item.notes || null,
    })),
  };

  if (!db.localState.orders) db.localState.orders = [];
  db.localState.orders.unshift(newOrder);

  // 2. Dọn bàn
  const tIndex = db.localState.tables.findIndex(t => t.id === Number(table_id));
  if (tIndex > -1) {
    db.localState.tables[tIndex] = {
      ...db.localState.tables[tIndex],
      current_items: [],
      status: 'empty',
      start_time: null,
      updated_at: nowStr,
    };
  }
  db.saveLocalState();
  const updatedTable = db.localState.tables[tIndex];

  // 3. Lưu vào PostgreSQL nếu có
  if (db.isPostgresConnected && db.pool) {
    (async () => {
      try {
        const client = await db.pool.connect();
        await client.query('BEGIN');
        const oRes = await client.query(
          `INSERT INTO orders (order_code, table_id, table_name, total_amount, payment_method, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [orderCode, table_id, `Bàn ${table_id}`, total_amount, payment_method || 'CASH', notes || null, nowStr]
        );
        const orderId = oRes.rows[0].id;

        for (const it of newOrder.items) {
          await client.query(
            `INSERT INTO order_items (order_id, product_name, quantity, unit_price, subtotal, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId, it.product_name, it.quantity, it.unit_price, it.subtotal, it.notes]
          );
        }

        await client.query(
          `UPDATE dining_tables SET current_items = '[]'::jsonb, status = 'empty', start_time = NULL WHERE id = $1`,
          [table_id]
        );
        await client.query('COMMIT');
        client.release();
      } catch (e) {
        console.warn('[PG Order Save Error]:', e.message);
      }
    })();
  }

  // 4. WebSocket Broadcast
  broadcast('ORDER_COMPLETED', {
    order: newOrder,
    tableId: Number(table_id),
    tableData: updatedTable,
  });

  // 5. Gửi email
  const settings = db.localState.settings;
  if (settings && settings.email_enabled && settings.receiver_email) {
    const emailHtml = generateOrderEmailHtml(newOrder, settings);
    const emailSubject = `☕ [${settings.name || 'Cafe Cherry'}] Đơn hoàn tất: Bàn ${table_id} - ${Number(total_amount).toLocaleString('vi-VN')} đ`;

    dispatchEmail({
      emailSettings: settings,
      to: settings.receiver_email,
      subject: emailSubject,
      htmlBody: emailHtml,
    }, (err) => {
      if (err) console.error('[Auto Email Error]:', err.message);
      else console.log(`[Auto Email] ✅ Đã gửi email đơn #${orderCode} tới ${settings.receiver_email}`);
    });
  }

  res.status(201).json({
    success: true,
    message: 'Thanh toán thành công!',
    order: newOrder,
    table: updatedTable,
  });
}

module.exports = {
  getOrders,
  createOrder,
};
