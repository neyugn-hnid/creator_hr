// ws-server.js — Standalone WebSocket Broadcast Server (port 3001)
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = 3001;
const clients = new Set();

const httpServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        let sent = 0;
        const messageToSend = JSON.stringify({
          event: 'NOTIFICATION',
          title: payload.title,
          message: payload.message,
          notifType: payload.type || payload.notifType || 'INFO',
          targetUserId: payload.targetUserId,
          sentBy: payload.sentBy,
          createdAt: new Date().toISOString(),
        });

        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageToSend);
            sent++;
          }
        }
        console.log(`[WS] Broadcast to ${sent}/${clients.size} clients: "${payload.title}"`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, sent, total: clients.size }));
      } catch (err) {
        res.writeHead(400); res.end(JSON.stringify({ ok: false, error: String(err) }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, clients: clients.size }));
    return;
  }

  res.writeHead(404); res.end('Not Found');
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  clients.add(ws);
  const ip = req.socket.remoteAddress;
  console.log(`[WS] Client connected from ${ip} | Total: ${clients.size}`);
  ws.on('close', () => { clients.delete(ws); console.log(`[WS] Disconnected | Total: ${clients.size}`); });
  ws.on('error', () => clients.delete(ws));
  ws.send(JSON.stringify({ event: 'CONNECTED', message: 'MediaPulse WS Ready' }));
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[WS] MediaPulse WebSocket Server: ws://0.0.0.0:${PORT}`);
  console.log(`[WS] Broadcast endpoint: POST http://localhost:${PORT}/broadcast`);
});
