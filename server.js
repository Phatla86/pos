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
