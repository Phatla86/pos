const WebSocket = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    // Gửi thông báo kết nối thành công
    ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Kết nối WebSocket CafePOS thành công' }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        // Chuyển tiếp các thông điệp broadcast đến các client khác
        broadcast(data.type, data.payload, ws);
      } catch (err) {
        console.error('[WebSocket Message Error]:', err.message);
      }
    });

    ws.on('error', (err) => {
      console.error('[WebSocket Error]:', err.message);
    });
  });

  console.log('[WebSocket] ✅ Máy chủ WebSocket đã sẵn sàng tại đường dẫn /ws');
}

function broadcast(type, payload, senderWs = null) {
  if (!wss) return;
  const message = JSON.stringify({ type, payload });

  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = {
  initWebSocket,
  broadcast,
};
