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