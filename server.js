const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const os = require('os');

// Render tự động cấp cổng qua process.env.PORT, nếu không có thì dùng 8080
let PORT = parseInt(process.env.PORT) || 8080;
const HTML_FILE = path.join(__dirname, 'pos_cafe_app.html');
const DB_FILE = path.join(__dirname, 'pos_database.json');

// Khởi tạo trạng thái 10 bàn
let posState = {
  tables: {},
  ordersHistory: [],
  products: null
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
    if (parsed.products) posState.products = parsed.products;
    console.log('[Database] Đã tải dữ liệu lịch sử');
  } catch (e) {
    console.error('[Database] Lỗi đọc dữ liệu:', e.message);
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(posState, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Database] Lỗi lưu db:', e.message);
  }
}

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/' || req.url === '/index.html' || req.url === '/pos') {
    if (fs.existsSync(HTML_FILE)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(HTML_FILE).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Không tìm thấy file giao diện pos_cafe_app.html');
    }
  } else if (req.url === '/api/state') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(posState));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WebSocket] Thiết bị kết nối mới: ${clientIp}`);

  ws.send(JSON.stringify({
    type: 'SYNC_ALL',
    payload: posState,
    senderId: 'SERVER'
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const { type, payload } = data;

      if (type === 'TABLE_UPDATE' && payload) {
        posState.tables[payload.tableId] = payload.tableData;
        saveDB();
      } else if (type === 'ORDER_COMPLETED' && payload) {
        posState.tables[payload.tableId] = payload.tableData;
        posState.ordersHistory.unshift(payload.order);
        saveDB();
      } else if (type === 'MENU_UPDATE' && payload) {
        posState.products = payload.products;
        saveDB();
      } else if (type === 'STATE_UPDATE' && payload) {
        if (payload.tables) posState.tables = payload.tables;
        if (payload.ordersHistory) posState.ordersHistory = payload.ordersHistory;
        if (payload.products) posState.products = payload.products;
        saveDB();
      }

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    } catch (err) {
      console.error('[WebSocket] Lỗi tin nhắn:', err.message);
    }
  });

  ws.on('close', () => {
    console.log(`[WebSocket] Thiết bị ngắt kết nối: ${clientIp}`);
  });
});

function startServer(portToTry) {
  server.listen(portToTry, '0.0.0.0', () => {
    console.log('========================================================');
    console.log(`☕ CAFE POS SERVER ĐÃ CHẠY THÀNH CÔNG TRÊN CỔNG ${portToTry}`);
    console.log('========================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      startServer(portToTry + 1);
    } else {
      console.error('Lỗi server:', err);
    }
  });
}

startServer(PORT);
