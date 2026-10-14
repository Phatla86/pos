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