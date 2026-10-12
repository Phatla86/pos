let nodemailer = null;
try { nodemailer = require('nodemailer'); } catch(e) {}
const https = require('https');

function generateOrderEmailHtml(order, shopSettings) {
  const shopName = (shopSettings && shopSettings.name) || 'Cafe Cherry';
  const shopAddr = (shopSettings && shopSettings.address) || '123 Nguyễn Huệ, Quận 1, TP. HCM';
  const shopPhone = (shopSettings && shopSettings.phone) || '0901 234 567';

  const itemsHtml = (order.items || []).map(item => `
    <tr style="border-bottom: 1px solid #f3f4f6;">
      <td style="padding: 10px 8px; font-weight: 600; color: #1f2937;">
        ${item.product_name || item.name}
        ${item.notes ? `<div style="font-size: 11px; color: #9ca3af; font-weight: 400; font-style: italic;">(${item.notes})</div>` : ''}
      </td>
      <td style="padding: 10px 8px; text-align: center; color: #4b5563;">x${item.quantity || item.qty}</td>
      <td style="padding: 10px 8px; text-align: right; color: #4b5563;">${((item.unit_price || item.price) || 0).toLocaleString('vi-VN')} đ</td>
      <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #111827;">${(((item.unit_price || item.price) * (item.quantity || item.qty)) || 0).toLocaleString('vi-VN')} đ</td>
    </tr>
  `).join('');

  const formattedTotal = (order.total_amount || order.total || 0).toLocaleString('vi-VN') + ' đ';
  const methodLabel = order.payment_method === 'TRANSFER' || order.method === 'TRANSFER' ? 'Chuyển khoản (VietQR)' : 'Tiền mặt';

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
      <!-- HEADER -->
      <div style="background: linear-gradient(135deg, #881337 0%, #be123c 100%); color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">☕ ${shopName}</h1>
        <p style="margin: 0; font-size: 13px; opacity: 0.9;">HÓA ĐƠN THANH TOÁN HOÀN TẤT</p>
      </div>

      <!-- METADATA -->
      <div style="padding: 20px 24px; background: #fff1f2; border-bottom: 1px dashed #fecdd3; display: flex; justify-content: space-between;">
        <div>
          <span style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">BÀN PHỤC VỤ</span>
          <div style="font-size: 18px; font-weight: 800; color: #881337;">${order.table_name || ('Bàn ' + order.table_id)}</div>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; text-transform: uppercase; color: #9f1239; font-weight: 700;">MÃ HÓA ĐƠN</span>
          <div style="font-size: 15px; font-weight: 800; color: #881337;">#${order.order_code || order.code}</div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      <div style="padding: 20px 24px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 11px; text-transform: uppercase;">
              <th style="padding: 8px; text-align: left;">Món</th>
              <th style="padding: 8px; text-align: center;">SL</th>
              <th style="padding: 8px; text-align: right;">Đơn giá</th>
              <th style="padding: 8px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <!-- TOTAL SUMMARY -->
        <div style="margin-top: 20px; padding: 16px; background: #fffbeb; border-radius: 12px; border: 1px solid #fde68a;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; color: #92400e;">
            <span>Hình thức thanh toán:</span>
            <span style="font-weight: 700;">${methodLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-top: 1px dashed #fcd34d; padding-top: 8px; font-size: 15px; font-weight: 800; color: #1e293b;">
            <span>TỔNG THANH TOÁN:</span>
            <span style="font-size: 20px; color: #b91c1c;">${formattedTotal}</span>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; margin-top: 24px; padding-top: 16px;">
          <div>${shopName} &bull; ${shopAddr} ${shopPhone ? `&bull; ĐT: ${shopPhone}` : ''}</div>
          <div style="margin-top: 4px;">Hệ thống CafePOS Full-stack Realtime</div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}

function sendEmailViaResend({ apiKey, to, subject, htmlBody }, callback) {
  const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);
  const postData = JSON.stringify({
    from: 'CafeCherry <onboarding@resend.dev>',
    to: recipients,
    subject: subject,
    html: htmlBody
  });

  const req = https.request({
    hostname: 'api.resend.com',
    port: 443,
    path: '/emails',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        callback(null, body);
      } else {
        callback(new Error(`Resend API Error HTTP ${res.statusCode}: ${body}`));
      }
    });
  });

  req.on('error', err => callback(err));
  req.on('timeout', () => { req.destroy(); callback(new Error('Resend API Timeout (10s)')); });
  req.write(postData);
  req.end();
}

function sendEmailViaGmail({ user, pass, to, subject, htmlBody }, callback) {
  if (!nodemailer) {
    return callback(new Error('Chưa cài đặt thư viện nodemailer (hãy chạy npm install trong thư mục server)'));
  }
  const cleanPass = (pass || '').replace(/\s+/g, '');
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass: cleanPass },
    connectionTimeout: 10000
  });

  transporter.sendMail({
    from: `"Cafe Cherry" <${user}>`,
    to,
    subject,
    html: htmlBody
  }, callback);
}

function dispatchEmail({ emailSettings, to, subject, htmlBody }, callback) {
  if (!emailSettings || !to) return callback && callback(new Error('Thiếu cấu hình email hoặc người nhận'));
  const cb = callback || (() => {});

  if (emailSettings.method === 'RESEND_API' && emailSettings.resend_api_key) {
    sendEmailViaResend({ apiKey: emailSettings.resend_api_key, to, subject, htmlBody }, cb);
  } else if (emailSettings.sender_email && emailSettings.sender_password) {
    sendEmailViaGmail({
      user: emailSettings.sender_email,
      pass: emailSettings.sender_password,
      to,
      subject,
      htmlBody
    }, cb);
  } else {
    cb(new Error('Chưa cấu hình mật khẩu ứng dụng Gmail hoặc Resend API key'));
  }
}

module.exports = {
  generateOrderEmailHtml,
  dispatchEmail,
};
