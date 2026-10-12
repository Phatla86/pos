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