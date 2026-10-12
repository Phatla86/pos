const db = require('../config/db');
const { broadcast } = require('../services/socketService');

// Lấy danh sách 10 bàn ăn
async function getTables(req, res) {
  try {
    if (db.isPostgresConnected && db.pool) {
      const result = await db.pool.query('SELECT * FROM dining_tables ORDER BY id ASC');
      if (result.rows && result.rows.length > 0) {
        return res.json({ success: true, tables: result.rows });
      }
    }
  } catch (err) {
    console.warn('[Tables PG Error]:', err.message);
  }

  // Luôn fallback về localState - Đảm bảo 100% trả về 10 bàn
  res.json({ success: true, tables: db.localState.tables });
}

// Cập nhật món trên bàn
async function updateTable(req, res) {
  const tableId = parseInt(req.params.id, 10);
  const { current_items, status, start_time } = req.body;

  const newStatus = (current_items && current_items.length > 0) ? 'occupied' : 'empty';
  const newStartTime = (newStatus === 'occupied') ? (start_time || new Date().toISOString()) : null;

  // Cập nhật localState
  const tIndex = db.localState.tables.findIndex(t => t.id === tableId);
  if (tIndex > -1) {
    db.localState.tables[tIndex] = {
      ...db.localState.tables[tIndex],
      current_items: current_items || [],
      status: newStatus,
      start_time: newStartTime,
      updated_at: new Date().toISOString(),
    };
  }
  db.saveLocalState();
  const updatedTable = db.localState.tables[tIndex] || { id: tableId, status: newStatus, current_items };

  // Cập nhật PostgreSQL nếu có
  if (db.isPostgresConnected && db.pool) {
    db.pool.query(
      `UPDATE dining_tables 
       SET current_items = $1, status = $2, start_time = $3, updated_at = NOW() 
       WHERE id = $4`,
      [JSON.stringify(current_items || []), newStatus, newStartTime, tableId]
    ).catch(e => console.warn('[PG updateTable err]:', e.message));
  }

  // Phát tín hiệu WebSocket cho tất cả máy khách
  broadcast('TABLE_UPDATE', { tableId, tableData: updatedTable });
  res.json({ success: true, table: updatedTable });
}

// Chuyển bàn / Gộp bàn
async function transferTable(req, res) {
  const { fromTableId, toTableId, mode } = req.body;

  const fromT = db.localState.tables.find(t => t.id === fromTableId);
  const toT = db.localState.tables.find(t => t.id === toTableId);

  if (!fromT || !toT) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bàn' });
  }

  let newToItems = [];
  if (mode === 'MERGE') {
    newToItems = [...(toT.current_items || []), ...(fromT.current_items || [])];
  } else {
    newToItems = fromT.current_items || [];
  }

  toT.current_items = newToItems;
  toT.status = 'occupied';
  toT.start_time = toT.start_time || new Date().toISOString();

  fromT.current_items = [];
  fromT.status = 'empty';
  fromT.start_time = null;

  db.saveLocalState();

  if (db.isPostgresConnected && db.pool) {
    db.pool.query(`
      UPDATE dining_tables SET current_items = $1, status = 'occupied', start_time = COALESCE(start_time, NOW()) WHERE id = $2;
      UPDATE dining_tables SET current_items = '[]'::jsonb, status = 'empty', start_time = NULL WHERE id = $3;
    `, [JSON.stringify(newToItems), toTableId, fromTableId]).catch(e => console.warn('[PG transfer err]:', e.message));
  }

  broadcast('TABLES_RESET', { tables: db.localState.tables });
  res.json({ success: true, message: 'Chuyển bàn thành công', tables: db.localState.tables });
}

// Dọn bàn
async function clearTable(req, res) {
  const tableId = parseInt(req.params.id, 10);
  const t = db.localState.tables.find(t => t.id === tableId);
  if (t) {
    t.current_items = [];
    t.status = 'empty';
    t.start_time = null;
    db.saveLocalState();
  }

  if (db.isPostgresConnected && db.pool) {
    db.pool.query(
      `UPDATE dining_tables SET current_items = '[]'::jsonb, status = 'empty', start_time = NULL WHERE id = $1`,
      [tableId]
    ).catch(e => console.warn('[PG clearTable err]:', e.message));
  }

  broadcast('TABLE_UPDATE', { tableId, tableData: t });
  res.json({ success: true, table: t });
}

module.exports = {
  getTables,
  updateTable,
  transferTable,
  clearTable,
};
