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