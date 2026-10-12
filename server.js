const zlib = require('zlib');

const DEFAULT_CATEGORIES = [
  { id: 'coffee', name: 'Cà phê', sort_order: 1 },
  { id: 'tea', name: 'Trà & Fruit Tea', sort_order: 2 },
  { id: 'smoothie', name: 'Sinh tố & Đá xay', sort_order: 3 },
  { id: 'snack', name: 'Bánh & Đồ ăn', sort_order: 4 },
];

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Cà phê Đen đá', category_id: 'coffee', category_name: 'Cà phê', price: 25000, image_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&q=80', is_available: true },
  { id: 2, name: 'Cà phê Sữa đá', category_id: 'coffee', category_name: 'Cà phê', price: 29000, image_url: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&q=80', is_available: true },
  { id: 3, name: 'Bạc xỉu 3 tầng', category_id: 'coffee', category_name: 'Cà phê', price: 32000, image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80', is_available: true },
  { id: 4, name: 'Cà phê Muối béo', category_id: 'coffee', category_name: 'Cà phê', price: 35000, image_url: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&q=80', is_available: true },
  { id: 5, name: 'Cà phê Cốt dừa', category_id: 'coffee', category_name: 'Cà phê', price: 39000, image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&q=80', is_available: true },
  { id: 6, name: 'Trà Đào Cam Sả', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', is_available: true },
  { id: 7, name: 'Trà Vải Hoa Hồng', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 35000, image_url: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=400&q=80', is_available: true },
  { id: 8, name: 'Trà Tắc Mật Ong', category_id: 'tea', category_name: 'Trà & Fruit Tea', price: 25000, image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', is_available: true },
  { id: 9, name: 'Sinh tố Bơ Đắk Lắk', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 42000, image_url: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&q=80', is_available: true },
  { id: 10, name: 'Matcha Đá xay kem Cheese', category_id: 'smoothie', category_name: 'Sinh tố & Đá xay', price: 45000, image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&q=80', is_available: true },
  { id: 11, name: 'Croissant Bơ tỏi phô mai', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 32000, image_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80', is_available: true },
  { id: 12, name: 'Hướng dương ngũ vị', category_id: 'snack', category_name: 'Bánh & Đồ ăn', price: 15000, image_url: 'https://images.unsplash.com/photo-1582293041079-7814c2f12063?w=400&q=80', is_available: true },
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