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

  // 7.5. SEND ORDER EMAIL API (/api/email/send-order)
  if (urlPath === '/api/email/send-order' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const targetEmail = body.toEmail || (posState.emailSettings && posState.emailSettings.receiverEmail);
    if (!targetEmail) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Chưa có địa chỉ email nhận.' }));
      return;
    }
    const order = body.order || {};
    const emailHtml = generateOrderEmailHtml(order, posState.shopSettings);
    const orderTotal = (order.total_amount || order.total || 0).toLocaleString('vi-VN');
    const emailSubject = `☕ [${posState.shopSettings.name || 'Cafe Cherry'}] Hóa đơn: ${order.table_name || order.tableName || ('Bàn ' + (order.table_id || 1))} - ${orderTotal} đ`;

    dispatchEmail({
      emailSettings: posState.emailSettings,
      to: targetEmail,
      subject: emailSubject,
      htmlBody: emailHtml
    }, (err) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, message: err.message || 'Lỗi gửi email.' }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: `Đã gửi hóa đơn thành công tới ${targetEmail}!` }));
      }
    });
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