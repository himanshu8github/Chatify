const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

class WebSocketServer {
  constructor() {
    this.clients = new Map();
    this.PORT = 8080;

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      if (req.url === "/" || req.url === "/index.html") {
        const filePath = path.join(__dirname, "../public/index.html");
        this.serveFile(res, filePath, "text/html");
      } else {
        const filePath = path.join(__dirname, "../public", req.url || "");
        this.serveFile(res, filePath);
      }
    });

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    this.setupWebSocketEvents();
  }

  serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("File not found");
        return;
      }

      if (!contentType) {
        const ext = path.extname(filePath);
        switch (ext) {
          case ".js":
            contentType = "text/javascript";
            break;
          case ".css":
            contentType = "text/css";
            break;
          case ".json":
            contentType = "application/json";
            break;
          case ".png":
            contentType = "image/png";
            break;
          case ".jpg":
          case ".jpeg":
            contentType = "image/jpeg";
            break;
          default:
            contentType = "text/plain";
        }
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  }

  setupWebSocketEvents() {
    this.wss.on("connection", (socket) => {
      const clientId = this.generateUniqueId();

      this.clients.set(clientId, {
        id: clientId,
        socket,
        lastActivity: new Date(),
      });

      console.log(`Client connected: ${clientId}`);

      // Send welcome
      this.sendToClient(clientId, {
        type: "connection",
        content: { id: clientId, message: "Connected to server" },
        sender: "server",
        timestamp: Date.now(),
      });

      // Broadcast join
      this.broadcast(
        {
          type: "user_joined",
          content: { id: clientId },
          sender: "server",
          timestamp: Date.now(),
        },
        clientId
      );

      // Handle messages
      socket.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());

          const client = this.clients.get(clientId);
          if (client) client.lastActivity = new Date();

          if (!message.sender) message.sender = clientId;
          if (!message.timestamp) message.timestamp = Date.now();

          console.log(`Received message from ${clientId}:`, message);

          this.handleMessage(clientId, message);
        } catch (error) {
          console.error("Error processing message:", error);
          this.sendToClient(clientId, {
            type: "error",
            content: "Invalid message format",
            sender: "server",
            timestamp: Date.now(),
          });
        }
      });

      socket.on("close", () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);

        this.broadcast({
          type: "user_left",
          content: { id: clientId },
          sender: "server",
          timestamp: Date.now(),
        });
      });

      socket.on("error", (error) => {
        console.error(`Error with client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  handleMessage(clientId, message) {
    switch (message.type) {
      case "chat":
        this.broadcast(message);
        break;

      case "ping":
        this.sendToClient(clientId, {
          type: "pong",
          content: { timestamp: Date.now() },
          sender: "server",
          timestamp: Date.now(),
        });
        break;

      case "private_message":
        if (message.content && message.content.recipient) {
          const recipientId = message.content.recipient;
          this.sendToClient(recipientId, message);
          this.sendToClient(clientId, {
            type: "message_delivered",
            content: { original: message },
            sender: "server",
            timestamp: Date.now(),
          });
        }
        break;

      default:
        console.log(`Unhandled message type: ${message.type}`);
    }
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  broadcast(message, excludeClientId) {
    this.clients.forEach((client) => {
      if (!excludeClientId || client.id !== excludeClientId) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.send(JSON.stringify(message));
        }
      }
    });
  }

  generateUniqueId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  start() {
    this.server.listen(this.PORT, () => {
      console.log(`WebSocket Server is running on port ${this.PORT}`);
    });

    setInterval(() => this.checkInactiveConnections(), 30000);
  }

  checkInactiveConnections() {
    const now = new Date();
    const timeout = 5 * 60 * 1000;

    this.clients.forEach((client, clientId) => {
      const timeDiff = now.getTime() - client.lastActivity.getTime();
      if (timeDiff > timeout) {
        console.log(`Client ${clientId} timed out due to inactivity`);
        client.socket.terminate();
        this.clients.delete(clientId);
      }
    });
  }
}

// Create and start the server
const wsServer = new WebSocketServer();
wsServer.start();

module.exports = WebSocketServer;
