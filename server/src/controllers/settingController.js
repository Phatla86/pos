const db = require('../config/db');
const { broadcast } = require('../services/socketService');
const { generateOrderEmailHtml, dispatchEmail } = require('../services/emailService');

// Lấy thông tin cấu hình quán, ngân hàng & email
async function getSettings(req, res) {
  try {
    if (db.isPostgresConnected && db.pool) {
      const result = await db.pool.query('SELECT * FROM shop_settings WHERE id = 1');
      if (result.rows && result.rows.length > 0) {
        return res.json({ success: true, settings: result.rows[0] });
      }
    }
  } catch (err) {
    console.warn('[Settings PG Error]:', err.message);
  }

  res.json({ success: true, settings: db.localState.settings });
}

// Cập nhật cấu hình
async function updateSettings(req, res) {
  const newSettings = req.body;

  db.localState.settings = {
    ...db.localState.settings,
    ...newSettings,
    updated_at: new Date().toISOString(),
  };
  db.saveLocalState();

  if (db.isPostgresConnected && db.pool) {
    const s = db.localState.settings;
    db.pool.query(
      `UPDATE shop_settings
       SET name = $1, address = $2, phone = $3, footer = $4, bank_id = $5,
           account_no = $6, account_name = $7, qr_template = $8, email_enabled = $9,
           email_method = $10, receiver_email = $11, sender_email = $12,
           sender_password = $13, resend_api_key = $14, updated_at = NOW()
       WHERE id = 1`,
      [
        s.name, s.address, s.phone, s.footer, s.bank_id, s.account_no, s.account_name,
        s.qr_template, s.email_enabled, s.email_method, s.receiver_email,
        s.sender_email, s.sender_password, s.resend_api_key
      ]
    ).catch(e => console.warn('[PG Settings Update Error]:', e.message));
  }

  broadcast('SETTINGS_UPDATE', { settings: db.localState.settings });
  res.json({ success: true, message: 'Đã lưu cấu hình thành công!', settings: db.localState.settings });
}

// Thử nghiệm gửi email hóa đơn mẫu
async function testEmail(req, res) {
  const { method, sender_email, sender_password, resend_api_key, receiver_email } = req.body;

  if (!receiver_email) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập email người nhận' });
  }

  try {
    const shopSettings = db.localState.settings || {};
    const testOrder = {
      order_code: 'TEST' + Date.now().toString().slice(-4),
      table_name: 'Bàn 1 (Thử nghiệm)',
      items: [
        { product_name: 'Cà phê Sữa đá', quantity: 2, unit_price: 26000, notes: 'Ít ngọt' },
        { product_name: 'Trà Đào Cam Sả', quantity: 1, unit_price: 35000, notes: 'Nhiều đá' },
      ],
      total_amount: 87000,
      payment_method: 'TRANSFER',
    };

    const emailHtml = generateOrderEmailHtml(testOrder, shopSettings);
    const tempSettings = {
      method: method || shopSettings.email_method,
      sender_email: sender_email || shopSettings.sender_email,
      sender_password: sender_password || shopSettings.sender_password,
      resend_api_key: resend_api_key || shopSettings.resend_api_key,
    };

    dispatchEmail({
      emailSettings: tempSettings,
      to: receiver_email,
      subject: `🧪 [Kiểm tra] Hóa đơn thử nghiệm từ ${shopSettings.name || 'Cafe Cherry'}`,
      htmlBody: emailHtml,
    }, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: `Gửi email thất bại: ${err.message}`,
        });
      }
      res.json({
        success: true,
        message: `Đã gửi email thử nghiệm thành công tới ${receiver_email}! Hãy kiểm tra hộp thư đến hoặc mục Spam.`,
      });
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  testEmail,
};
