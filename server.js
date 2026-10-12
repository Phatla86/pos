const zlib = require('zlib');

const DEFAULT_CATEGORIES = [
  { id: 'coffee', name: 'Cà phê', sort_order: 1 },
  { id: 'tea', name: 'Trà & Fruit Tea', sort_order: 2 },
  { id: 'smoothie', name: 'Sinh tố & Đá xay', sort_order: 3 },
  { id: 'snack', name: 'Bánh & Đồ ăn', sort_order: 4 },
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Cà phê Đen đá', category_id: 'coffee', category_name: 'Cà phê', price: 22000, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', is_available: true },
  { id: 2, name: 'Cà phê Sữa đá', category_id: 'coffee', category_name: 'Cà phê', price: 26000, image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80', is_available: true },
  { id: 3, name: 'Bạc xỉu Sài Gòn', category_id: 'coffee', category_name: 'Cà phê', price: 29000, image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', is_available: true },
  { id: 4, name: 'Cà phê Muối Huế', category_id: 'coffee', category_name: 'Cà phê', price: 32000, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&q=80', is_available: true },
  { id: 5, name: 'Trà Đào Cam Sả', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', is_available: true },
  { id: 6, name: 'Trà Vải Hoa Lài', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', is_available: true },
  { id: 7, name: 'Trà Sữa Oolong Nướng', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 38000, image_url: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80', is_available: true },
  { id: 8, name: 'Trà Chanh Giã Tay', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 28000, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', is_available: true },
  { id: 9, name: 'Sinh tố Bơ Đắk Lắk', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 42000, image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', is_available: true },
  { id: 10, name: 'Matcha Đá xay kem Cheese', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 45000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80', is_available: true },
  { id: 11, name: 'Sữa chua Dẻo Cacao', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 32000, image_url: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80', is_available: true },
  { id: 12, name: 'Croissant Bơ tỏi phô mai', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 32000, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', is_available: true },
  { id: 13, name: 'Bánh Mì Chảo Đặc biệt', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 45000, image_url: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400&q=80', is_available: true },
  { id: 14, name: 'Hướng dương ngũ vị', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 15000, image_url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80', is_available: true },
];

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const tls = require('tls');
const https = require('https');

const PORT = parseInt(process.env.PORT) || 8080;
const DB_FILE = path.join(__dirname, 'pos_database.json');

let posState = {
  tables: {},
  ordersHistory: [],
  products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
  shopSettings: {
    name: 'Cafe Cherry',
    address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    phone: '0901 234 567',
    footer: 'Cảm ơn quý khách & Hẹn gặp lại!'
  },
  bankSettings: {
    bankId: 'MB',
    accountNo: '868688286',
    accountName: 'LA PHAT'
  },
  emailSettings: {
    enabled: false,
    method: 'GMAIL_SMTP',
    receiverEmail: '',
    senderEmail: '',
    senderPassword: '',
    resendApiKey: ''
  },
  settingsUpdatedAt: 1,
  menuUpdatedAt: 1
};

for (let i = 1; i <= 10; i++) {
  posState.tables[i] = { id: i, name: `Bàn ${i}`, items: [], status: 'empty', startTime: null };
}

if (fs.existsSync(DB_FILE)) {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed.tables) posState.tables = parsed.tables;
    if (parsed.ordersHistory) posState.ordersHistory = parsed.ordersHistory;
    if (parsed.products && parsed.products.length > 0) posState.products = parsed.products; else posState.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    if (parsed.shopSettings) posState.shopSettings = parsed.shopSettings;
    if (parsed.bankSettings) posState.bankSettings = parsed.bankSettings;
    if (parsed.emailSettings) posState.emailSettings = parsed.emailSettings;
    if (parsed.settingsUpdatedAt) posState.settingsUpdatedAt = parsed.settingsUpdatedAt;
    if (parsed.menuUpdatedAt) posState.menuUpdatedAt = parsed.menuUpdatedAt;
    console.log('[Database] Đã tải dữ liệu từ pos_database.json');
  } catch (e) {
    console.error('[Database Error]:', e.message);
  }
} else {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(posState, null, 2), 'utf-8'); console.log('[Database] Đã khởi tạo pos_database.json thành công!'); } catch(e) {}
}

function saveDB() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(posState, null, 2), 'utf-8'); } catch (e) {}
}

function sendEmailViaResend({ apiKey, to, subject, htmlBody }, callback) {
  const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);
  const postData = JSON.stringify({
    from: 'CafePOS <onboarding@resend.dev>',
    to: recipients,
    subject: subject,
    html: htmlBody
  });

  const req = https.request('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    },
    timeout: 10000
  }, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        callback(null, { success: true });
      } else {
        try {
          const json = JSON.parse(body);
          callback(new Error(json.message || `Lỗi Resend (${res.statusCode}): ${body}`));
        } catch(e) {
          callback(new Error(`Lỗi Resend (${res.statusCode}): ${body}`));
        }
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    callback(new Error('Hết thời gian kết nối tới Resend API (Timeout 10s)'));
  });

  req.on('error', (err) => {
    callback(new Error(`Lỗi mạng Resend API: ${err.message}`));
  });

  req.write(postData);
  req.end();
}

function sendGmailSMTP({ sender, password, to, subject, htmlBody }, callback) {
  if (!sender || !password || !to) {
    callback(new Error('Vui lòng điền đầy đủ: Gmail gửi, Mật khẩu ứng dụng 16 chữ cái và Gmail nhận.'));
    return;
  }

  const cleanPass = password.replace(/\s+/g, '');
  const recipients = Array.isArray(to) ? to : to.split(',').map(e => e.trim()).filter(Boolean);
  if (recipients.length === 0) {
    callback(new Error('Chưa có địa chỉ Gmail nhận hợp lệ.'));
    return;
  }

  let isFinished = false;
  function finish(err, res) {
    if (isFinished) return;
    isFinished = true;
    try { client.destroy(); } catch(e) {}
    callback(err, res);
  }

  const client = tls.connect(465, 'smtp.gmail.com', {
    rejectUnauthorized: false,
    servername: 'smtp.gmail.com'
  }, () => {});

  client.setEncoding('utf8');
  client.setTimeout(12000, () => {
    finish(new Error('Hết thời gian kết nối tới smtp.gmail.com:465 (Timeout 12s). Máy chủ Render đang chặn cổng SMTP 465 ra ngoài.'));
  });

  let step = 0;
  let recipientIndex = 0;

  client.on('data', (data) => {
    const response = data.toString();
    const code = parseInt(response.substring(0, 3));

    if (code >= 400 && code <= 599) {
      let errMsg = `Lỗi Gmail (${code}): ${response.trim()}`;
      if (code === 535) {
        errMsg = 'Lỗi xác thực (535): Mật khẩu ứng dụng 16 chữ cái không đúng.';
      }
      finish(new Error(errMsg));
      return;
    }

    try {
      if (step === 0 && code === 220) {
        step = 1;
        client.write('EHLO localhost\r\n');
      } else if (step === 1 && code === 250) {
        step = 2;
        client.write('AUTH LOGIN\r\n');
      } else if (step === 2 && code === 334) {
        step = 3;
        client.write(Buffer.from(sender).toString('base64') + '\r\n');
      } else if (step === 3 && code === 334) {
        step = 4;
        client.write(Buffer.from(cleanPass).toString('base64') + '\r\n');
      } else if (step === 4 && code === 235) {
        step = 5;
        client.write(`MAIL FROM:<${sender}>\r\n`);
      } else if (step === 5 && code === 250) {
        step = 6;
        client.write(`RCPT TO:<${recipients[recipientIndex]}>\r\n`);
      } else if (step === 6 && code === 250) {
        recipientIndex++;
        if (recipientIndex < recipients.length) {
          client.write(`RCPT TO:<${recipients[recipientIndex]}>\r\n`);
        } else {
          step = 7;
          client.write('DATA\r\n');
        }
      } else if (step === 7 && code === 354) {
        step = 8;
        const rawSubject = `=?UTF-8?B?${Buffer.from(subject, 'utf-8').toString('base64')}?=`;
        const message = [
          `From: "${posState.shopSettings.name || 'Cafe POS'}" <${sender}>`,
          `To: ${recipients.join(', ')}`,
          `Subject: ${rawSubject}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: base64`,
          '',
          Buffer.from(htmlBody, 'utf-8').toString('base64'),
          '',
          '.'
        ].join('\r\n') + '\r\n';
        client.write(message);
      } else if (step === 8 && code === 250) {
        step = 9;
        client.write('QUIT\r\n');
        finish(null, { success: true });
      }
    } catch(err) {
      finish(err);
    }
  });

  client.on('error', (err) => {
    let msg = err.message || String(err);
    if (msg.includes('ETIMEDOUT') || msg.includes('ECONNREFUSED')) {
      msg = `Không thể kết nối đến smtp.gmail.com:465. Máy chủ Cloud Render đang chặn cổng SMTP ra ngoài.`;
    }
    finish(new Error(msg));
  });

  client.on('close', () => {
    if (!isFinished) finish(new Error('Kết nối tới Gmail SMTP bị ngắt đột ngột.'));
  });
}

function dispatchEmail({ emailSettings, to, subject, htmlBody }, callback) {
  const method = emailSettings.method || 'GMAIL_SMTP';
  if (method === 'RESEND_API' && emailSettings.resendApiKey) {
    sendEmailViaResend({
      apiKey: emailSettings.resendApiKey,
      to: to || emailSettings.receiverEmail,
      subject: subject,
      htmlBody: htmlBody
    }, callback);
  } else {
    sendGmailSMTP({
      sender: emailSettings.senderEmail,
      password: emailSettings.senderPassword,
      to: to || emailSettings.receiverEmail,
      subject: subject,
      htmlBody: htmlBody
    }, callback);
  }
}

function generateOrderEmailHtml(order, shopSettings) {
  const shopName = shopSettings.name || 'Cafe Sài Gòn';
  const shopAddr = shopSettings.address || '';
  const shopPhone = shopSettings.phone || '';
  const methodLabel = order.method === 'CASH' ? '💵 Tiền mặt' : '📱 Chuyển khoản VietQR';
  const formattedTotal = (order.total || 0).toLocaleString('vi-VN') + ' đ';

  let itemsRows = '';
  (order.items || []).forEach(it => {
    const itSub = (it.price * it.qty).toLocaleString('vi-VN') + ' đ';
    itemsRows += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 600; color: #1e293b;">
          ${it.name}
          ${it.notes ? `<div style="font-size: 11px; color: #d97706; margin-top: 2px;">📝 ${it.notes}</div>` : ''}
        </td>
        <td style="padding: 10px 8px; text-align: center; color: #475569;">x${it.qty}</td>
        <td style="padding: 10px 8px; text-align: right; color: #475569;">${(it.price).toLocaleString('vi-VN')} đ</td>
        <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #1e293b;">${itSub}</td>
      </tr>
    `;
  });

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"></head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #8b5a2b, #d97706); color: white; padding: 18px; text-align: center;">
        <div style="font-size: 30px; margin-bottom: 4px;">☕</div>
        <h2 style="margin: 0; font-size: 19px; font-weight: 800;">${shopName}</h2>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">THÔNG BÁO HOÀN TẤT ĐƠN HÀNG</p>
      </div>
      <div style="padding: 18px;">
        <div style="background: #f1f5f9; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px; display: flex; justify-content: space-between;">
          <div>
            <div style="font-size: 11px; color: #64748b;">Vị trí bàn</div>
            <div style="font-size: 15px; font-weight: 800; color: #1e293b;">Bàn ${order.tableId}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; color: #64748b;">Mã đơn / Thời gian</div>
            <div style="font-size: 13px; font-weight: 700; color: #1e293b;">#${order.code} &bull; ${order.time}</div>
          </div>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 14px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 2px solid #cbd5e1; color: #64748b; font-size: 11px;">
              <th style="padding: 6px 8px; text-align: left;">Món</th>
              <th style="padding: 6px 8px; text-align: center;">SL</th>
              <th style="padding: 6px 8px; text-align: right;">Đơn giá</th>
              <th style="padding: 6px 8px; text-align: right;">T.Tiền</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-bottom: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 12px; color: #92400e;">Hình thức:</span>
            <span style="font-size: 12px; font-weight: 700; color: #92400e;">${methodLabel}</span>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #fcd34d; padding-top: 6px;">
            <span style="font-size: 14px; font-weight: 800; color: #1e293b;">TỔNG THANH TOÁN:</span>
            <span style="font-size: 18px; font-weight: 800; color: #b45309;">${formattedTotal}</span>
          </div>
        </div>
        <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          <div>${shopName} &bull; ${shopAddr} ${shopPhone ? `&bull; ĐT: ${shopPhone}` : ''}</div>
          <div style="margin-top: 3px;">Hệ thống thông báo tự động từ CafePOS Realtime</div>
        </div>
      </div>
    </div>
  </body>
  </html>`;
}


const EMBEDDED_HTML_B64 = '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';
let cachedEmbeddedHtml = null;

function getFallbackHtml() {
  if (!cachedEmbeddedHtml) {
    try {
      const buf = Buffer.from(EMBEDDED_HTML_B64, 'base64');
      cachedEmbeddedHtml = zlib.gunzipSync(buf);
    } catch(e) {
      return '<h2 style="font-family:sans-serif; text-align:center; padding:2rem; color:#b45309;">☕ Đang nạp dữ liệu CafePOS...</h2>';
    }
  }
  return cachedEmbeddedHtml;
}

function findHtmlFile() {
  const candidates = [
    path.join(__dirname, 'pos_cafe_app.html'),
    path.join(__dirname, 'index.html'),
    path.join(process.cwd(), 'pos_cafe_app.html')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  try {
    const files = fs.readdirSync(__dirname);
    for (const f of files) {
      if (f.endsWith('.html')) return path.join(__dirname, f);
    }
  } catch(e) {}
  return null;
}


function parseJsonBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); } catch(e) { resolve({}); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const urlPath = (req.url || '/').split('?')[0];

  // 1. HEALTH CHECK & KEEP-ALIVE
  if (urlPath === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'UP', message: 'Cafe Cherry POS Server 24/7', timestamp: new Date().toISOString() }));
    return;
  }

  // 2. STATE OVERVIEW API
  if (urlPath === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(posState));
    return;
  }

  // 3. TABLES API (/api/tables)
  if (urlPath === '/api/tables' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, tables: Object.values(posState.tables) }));
    return;
  }

  if (urlPath.startsWith('/api/tables/') && req.method === 'PUT') {
    const tableId = parseInt(urlPath.split('/')[3], 10);
    const body = await parseJsonBody(req);
    posState.tables[tableId] = {
      ...posState.tables[tableId],
      id: tableId,
      name: `Bàn ${tableId}`,
      current_items: body.current_items || [],
      items: body.current_items || [],
      status: (body.current_items && body.current_items.length > 0) ? 'occupied' : 'empty',
      start_time: body.start_time || (body.current_items?.length > 0 ? new Date().toISOString() : null)
    };
    saveDB();
    broadcastAll('TABLE_UPDATE', { tableId, tableData: posState.tables[tableId] });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, table: posState.tables[tableId] }));
    return;
  }

  if (urlPath === '/api/tables/transfer' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const { fromTableId, toTableId, mode } = body;
    const fromT = posState.tables[fromTableId];
    const toT = posState.tables[toTableId];
    if (fromT && toT) {
      const fromItems = fromT.current_items || fromT.items || [];
      const toItems = toT.current_items || toT.items || [];
      const newItems = mode === 'MERGE' ? [...toItems, ...fromItems] : fromItems;

      posState.tables[toTableId] = {
        ...toT,
        status: 'occupied',
        start_time: toT.start_time || new Date().toISOString(),
        current_items: newItems,
        items: newItems
      };
      posState.tables[fromTableId] = {
        ...fromT,
        status: 'empty',
        start_time: null,
        current_items: [],
        items: []
      };
      saveDB();
      broadcastAll('TABLES_RESET', { tables: Object.values(posState.tables) });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, tables: Object.values(posState.tables) }));
      return;
    }
  }

  if (urlPath.startsWith('/api/tables/') && req.method === 'DELETE') {
    const tableId = parseInt(urlPath.split('/')[3], 10);
    posState.tables[tableId] = {
      id: tableId,
      name: `Bàn ${tableId}`,
      items: [],
      current_items: [],
      status: 'empty',
      startTime: null,
      start_time: null
    };
    saveDB();
    broadcastAll('TABLE_UPDATE', { tableId, tableData: posState.tables[tableId] });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, table: posState.tables[tableId] }));
    return;
  }

  // 4. PRODUCTS & MENU API (/api/products)
  if (urlPath === '/api/products' && req.method === 'GET') {
    if (!posState.products || posState.products.length === 0) {
      posState.products = JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, products: posState.products, categories: DEFAULT_CATEGORIES }));
    return;
  }

  if (urlPath === '/api/products' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const newId = (posState.products.reduce((max, p) => Math.max(max, p.id || 0), 0) || 0) + 1;
    const newProd = {
      id: newId,
      name: body.name || 'Món mới',
      category_id: body.category_id || 'coffee',
      category_name: DEFAULT_CATEGORIES.find(c => c.id === body.category_id)?.name || 'Cà phê',
      price: Number(body.price || 0),
      image_url: body.image_url || null,
      is_available: body.is_available !== false
    };
    posState.products.push(newProd);
    posState.menuUpdatedAt = Date.now();
    saveDB();
    broadcastAll('MENU_UPDATE', { products: posState.products, menuUpdatedAt: posState.menuUpdatedAt });
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, product: newProd }));
    return;
  }

  if (urlPath.startsWith('/api/products/') && req.method === 'PUT') {
    const prodId = parseInt(urlPath.split('/')[3], 10);
    const body = await parseJsonBody(req);
    const p = (posState.products || []).find(it => it.id === prodId);
    if (p) {
      if (body.name !== undefined) p.name = body.name;
      if (body.price !== undefined) p.price = Number(body.price);
      if (body.category_id !== undefined) {
        p.category_id = body.category_id;
        p.category_name = DEFAULT_CATEGORIES.find(c => c.id === body.category_id)?.name || p.category_name;
      }
      if (body.image_url !== undefined) p.image_url = body.image_url;
      if (body.is_available !== undefined) p.is_available = body.is_available;

      posState.menuUpdatedAt = Date.now();
      saveDB();
      broadcastAll('MENU_UPDATE', { products: posState.products, menuUpdatedAt: posState.menuUpdatedAt });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, product: p }));
      return;
    }
  }

  if (urlPath.startsWith('/api/products/') && req.method === 'DELETE') {
    const prodId = parseInt(urlPath.split('/')[3], 10);
    posState.products = (posState.products || []).filter(p => p.id !== prodId);
    posState.menuUpdatedAt = Date.now();
    saveDB();
    broadcastAll('MENU_UPDATE', { products: posState.products, menuUpdatedAt: posState.menuUpdatedAt });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã xóa món' }));
    return;
  }

  // 5. ORDERS API (/api/orders)
  if (urlPath === '/api/orders' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, orders: posState.ordersHistory }));
    return;
  }

  if (urlPath === '/api/orders' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const orderCode = 'HD' + Date.now().toString().slice(-6);
    const newOrder = {
      id: Date.now(),
      order_code: orderCode,
      code: orderCode,
      table_id: body.table_id,
      tableName: `Bàn ${body.table_id}`,
      table_name: `Bàn ${body.table_id}`,
      items: body.items || [],
      total_amount: Number(body.total_amount || 0),
      total: Number(body.total_amount || 0),
      payment_method: body.payment_method || 'CASH',
      method: body.payment_method || 'CASH',
      status: 'COMPLETED',
      notes: body.notes || null,
      created_at: new Date().toISOString(),
      timestamp: Date.now()
    };

    posState.ordersHistory.unshift(newOrder);

    // Clear table
    if (body.table_id && posState.tables[body.table_id]) {
      posState.tables[body.table_id] = {
        id: body.table_id,
        name: `Bàn ${body.table_id}`,
        items: [],
        current_items: [],
        status: 'empty',
        startTime: null,
        start_time: null
      };
    }
    saveDB();

    broadcastAll('ORDER_COMPLETED', {
      order: newOrder,
      tableId: body.table_id,
      tableData: posState.tables[body.table_id]
    });

    // Auto email if configured
    if (posState.emailSettings && posState.emailSettings.enabled && posState.emailSettings.receiverEmail) {
      const emailHtml = generateOrderEmailHtml(newOrder, posState.shopSettings);
      const emailSubject = `☕ [${posState.shopSettings.name || 'Cafe Cherry'}] Đơn hoàn tất: Bàn ${body.table_id} - ${(newOrder.total_amount||0).toLocaleString('vi-VN')} đ`;
      dispatchEmail({
        emailSettings: posState.emailSettings,
        to: posState.emailSettings.receiverEmail,
        subject: emailSubject,
        htmlBody: emailHtml
      }, (err) => {
        if (err) console.error('[Auto Email Error]:', err.message);
      });
    }

    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, order: newOrder, table: posState.tables[body.table_id] }));
    return;
  }

  // 6. REVENUE REPORTS API (/api/reports/revenue)
  if (urlPath === '/api/reports/revenue' && req.method === 'GET') {
    const orders = posState.ordersHistory || [];
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
      const date = (o.created_at || new Date(o.timestamp || Date.now()).toISOString()).slice(0, 10);
      const month = date.slice(0, 7);
      const year = date.slice(0, 4);
      const amount = Number(o.total_amount || o.total || 0);
      const isCash = (o.payment_method || o.method) === 'CASH';

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

      (o.items || []).forEach(it => {
        const pName = it.product_name || it.name || 'Món';
        if (!productMap[pName]) productMap[pName] = { qty: 0, total: 0 };
        productMap[pName].qty += (it.quantity || it.qty || 1);
        productMap[pName].total += (it.subtotal || ((it.unit_price || it.price || 0) * (it.quantity || it.qty || 1)));
      });
    });

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      summary: {
        today_revenue: todayRev,
        today_orders: todayCount,
        month_revenue: monthRev,
        month_orders: monthCount,
        year_revenue: yearRev,
        year_orders: yearCount,
        all_time_revenue: allRev,
        all_time_orders: allCount
      },
      daily: Object.entries(dailyMap).map(([k, v]) => ({ period_label: k, order_count: v.count, total_revenue: v.total, cash_revenue: v.cash, transfer_revenue: v.transfer })).sort((a,b)=>b.period_label.localeCompare(a.period_label)),
      monthly: Object.entries(monthlyMap).map(([k, v]) => ({ period_label: k, order_count: v.count, total_revenue: v.total, cash_revenue: v.cash, transfer_revenue: v.transfer })).sort((a,b)=>b.period_label.localeCompare(a.period_label)),
      yearly: Object.entries(yearlyMap).map(([k, v]) => ({ period_label: k, order_count: v.count, total_revenue: v.total, cash_revenue: v.cash, transfer_revenue: v.transfer })).sort((a,b)=>b.period_label.localeCompare(a.period_label)),
      topProducts: Object.entries(productMap).map(([k, v]) => ({ product_name: k, total_qty: v.qty, total_revenue: v.total })).sort((a,b)=>b.total_qty - a.total_qty).slice(0, 5)
    }));
    return;
  }

  // 7. SETTINGS API (/api/settings)
  if (urlPath === '/api/settings' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      settings: {
        ...posState.shopSettings,
        ...posState.bankSettings,
        email_enabled: posState.emailSettings.enabled,
        email_method: posState.emailSettings.method,
        receiver_email: posState.emailSettings.receiverEmail,
        sender_email: posState.emailSettings.senderEmail,
        sender_password: posState.emailSettings.senderPassword,
        resend_api_key: posState.emailSettings.resendApiKey
      }
    }));
    return;
  }

  if (urlPath === '/api/settings' && req.method === 'PUT') {
    const body = await parseJsonBody(req);
    if (body.name || body.address || body.phone || body.footer) {
      posState.shopSettings = {
        name: body.name || posState.shopSettings.name,
        address: body.address || posState.shopSettings.address,
        phone: body.phone || posState.shopSettings.phone,
        footer: body.footer || posState.shopSettings.footer
      };
    }
    if (body.bank_id || body.account_no || body.account_name || body.qr_template) {
      posState.bankSettings = {
        bankId: body.bank_id || posState.bankSettings.bankId,
        accountNo: body.account_no || posState.bankSettings.accountNo,
        accountName: body.account_name || posState.bankSettings.accountName,
        template: body.qr_template || 'compact2'
      };
    }
    if (body.email_enabled !== undefined || body.email_method || body.receiver_email || body.sender_email) {
      posState.emailSettings = {
        enabled: body.email_enabled !== undefined ? body.email_enabled : posState.emailSettings.enabled,
        method: body.email_method || posState.emailSettings.method,
        receiverEmail: body.receiver_email || posState.emailSettings.receiverEmail,
        senderEmail: body.sender_email || posState.emailSettings.senderEmail,
        senderPassword: body.sender_password || posState.emailSettings.senderPassword,
        resendApiKey: body.resend_api_key || posState.emailSettings.resendApiKey
      };
    }
    posState.settingsUpdatedAt = Date.now();
    saveDB();
    broadcastAll('SETTINGS_UPDATE', { settings: body });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, message: 'Đã lưu cấu hình thành công' }));
    return;
  }

  // 8. TĨNH / PHỤC VỤ GIAO DIỆN (HTML)
  const htmlPath = findHtmlFile();
  if (htmlPath) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(htmlPath).pipe(res);
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getFallbackHtml());
  }
});

function broadcastAll(type, payload) {
  if (!wss) return;
  const msg = JSON.stringify({ type, payload, senderId: 'SERVER' });
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) {
      try { c.send(msg); } catch(e) {}
    }
  });
}

// 9. TỰ ĐỘNG GIỮ KẾT NỐI CHO RENDER CLOUD 24/24 (SELF-PING MỖI 10 PHÚT)
setInterval(() => {
  const renderHost = process.env.RENDER_EXTERNAL_HOSTNAME || 'pos-qhih.onrender.com';
  if (renderHost) {
    https.get(`https://${renderHost}/health`, (res) => {
      // Keep awake success
    }).on('error', () => {});
  }
}, 10 * 60 * 1000);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'SYNC_ALL', payload: posState, senderId: 'SERVER' }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;
      if (type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
        return;
      }

      if (type === 'TABLE_UPDATE' && payload) {
        posState.tables[payload.tableId] = payload.tableData;
        saveDB();
      } else if (type === 'ORDER_COMPLETED' && payload) {
        posState.tables[payload.tableId] = payload.tableData;
        
        // Gộp đơn hàng trên server tránh trùng lặp
        const ordersMap = {};
        posState.ordersHistory.forEach(o => { if (o && o.code) ordersMap[o.code] = o; });
        if (payload.order && payload.order.code) ordersMap[payload.order.code] = payload.order;
        posState.ordersHistory = Object.values(ordersMap).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        saveDB();

        if (posState.emailSettings && posState.emailSettings.enabled && posState.emailSettings.receiverEmail) {
          const emailHtml = generateOrderEmailHtml(payload.order, posState.shopSettings);
          const emailSubject = `☕ [${posState.shopSettings.name || 'Cafe'}] Đơn hoàn thành: Bàn ${payload.order.tableId} - ${(payload.order.total||0).toLocaleString('vi-VN')} đ`;

          dispatchEmail({
            emailSettings: posState.emailSettings,
            to: posState.emailSettings.receiverEmail,
            subject: emailSubject,
            htmlBody: emailHtml
          }, (err) => {
            if (err) console.error('[Auto Email Error]:', err.message);
          });
        }
      } else if (type === 'MENU_UPDATE' && payload) {
        posState.products = payload.products;
        posState.menuUpdatedAt = payload.menuUpdatedAt || Date.now();
        saveDB();
      } else if (type === 'SHOP_SETTINGS_UPDATE' && payload) {
        posState.shopSettings = payload.shopSettings;
        posState.settingsUpdatedAt = payload.settingsUpdatedAt || Date.now();
        saveDB();
      } else if (type === 'BANK_SETTINGS_UPDATE' && payload) {
        posState.bankSettings = payload.bankSettings;
        posState.settingsUpdatedAt = payload.settingsUpdatedAt || Date.now();
        saveDB();
      } else if (type === 'EMAIL_SETTINGS_UPDATE' && payload) {
        posState.emailSettings = payload.emailSettings;
        posState.settingsUpdatedAt = payload.settingsUpdatedAt || Date.now();
        saveDB();
      } else if (type === 'TEST_EMAIL') {
        const testOrder = {
          code: 'HD' + Date.now().toString().slice(-6),
          tableId: 1,
          items: [
            { name: 'Cà phê Sữa đá', qty: 2, price: 29000, notes: 'Ít ngọt' },
            { name: 'Trà Đào Cam Sả', qty: 1, price: 35000, notes: 'Ít đá' }
          ],
          total: 93000,
          method: 'TRANSFER',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        const emailHtml = generateOrderEmailHtml(testOrder, posState.shopSettings);

        const tempSettings = {
          method: payload.method || (posState.emailSettings && posState.emailSettings.method) || 'GMAIL_SMTP',
          senderEmail: payload.senderEmail || (posState.emailSettings && posState.emailSettings.senderEmail),
          senderPassword: payload.senderPassword || (posState.emailSettings && posState.emailSettings.senderPassword),
          resendApiKey: payload.resendApiKey || (posState.emailSettings && posState.emailSettings.resendApiKey),
          receiverEmail: payload.receiverEmail || (posState.emailSettings && posState.emailSettings.receiverEmail)
        };

        dispatchEmail({
          emailSettings: tempSettings,
          to: tempSettings.receiverEmail,
          subject: `🧪 [Kiểm tra] Thử nghiệm gửi email từ ${posState.shopSettings.name || 'Cafe POS'}`,
          htmlBody: emailHtml
        }, (err) => {
          const errMsg = err ? (err.message || String(err)) : '';
          ws.send(JSON.stringify({
            type: 'TEST_EMAIL_RESULT',
            payload: {
              success: !err,
              message: err ? errMsg : 'Đã gửi email thử nghiệm thành công! Hãy kiểm tra hòm thư Gmail của bạn (nhớ xem cả mục Hộp thư đến và mục Thư rác/Spam).'
            }
          }));
        });
      } else if (type === 'RESTORE_STATE' && payload) {
        // Gộp bàn: Bảo toàn các bàn đang có khách
        if (payload.tables) {
          for (let i = 1; i <= 10; i++) {
            const clientT = payload.tables[i];
            if (clientT && clientT.items && clientT.items.length > 0) {
              posState.tables[i] = clientT;
            }
          }
        }
        // Gộp đơn hàng bền vững
        if (payload.ordersHistory && payload.ordersHistory.length > 0) {
          const ordersMap = {};
          posState.ordersHistory.forEach(o => { if (o && o.code) ordersMap[o.code] = o; });
          payload.ordersHistory.forEach(o => { if (o && o.code) ordersMap[o.code] = o; });
          posState.ordersHistory = Object.values(ordersMap).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        }
        if (payload.products && (payload.menuUpdatedAt || 0) >= (posState.menuUpdatedAt || 0)) {
          posState.products = payload.products;
          posState.menuUpdatedAt = payload.menuUpdatedAt;
        }
        if (payload.shopSettings && (payload.settingsUpdatedAt || 0) >= (posState.settingsUpdatedAt || 0)) {
          posState.shopSettings = payload.shopSettings;
          posState.settingsUpdatedAt = payload.settingsUpdatedAt;
        }
        if (payload.bankSettings && (payload.settingsUpdatedAt || 0) >= (posState.settingsUpdatedAt || 0)) {
          posState.bankSettings = payload.bankSettings;
          posState.settingsUpdatedAt = payload.settingsUpdatedAt;
        }
        if (payload.emailSettings && (payload.settingsUpdatedAt || 0) >= (posState.settingsUpdatedAt || 0)) {
          posState.emailSettings = payload.emailSettings;
          posState.settingsUpdatedAt = payload.settingsUpdatedAt;
        }
        saveDB();
      }

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    } catch (err) {}
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`☕ CAFE POS SERVER ĐANG CHẠY TRÊN CỔNG ${PORT}`);
});