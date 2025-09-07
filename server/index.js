// File: index.js
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

class WebSocketServer {
  constructor() {
    this.clients = new Map(); // clientId => { socket, lastActivity, roomId }
    this.rooms = new Map();   // roomId => Set of clientIds
    this.PORT = 8080;

    // HTTP server for serving static files (optional)
    this.server = http.createServer((req, res) => {
      if (req.url === "/" || req.url === "/index.html") {
        const filePath = path.join(__dirname, "public/index.html");
        this.serveFile(res, filePath, "text/html");
      } else {
        const filePath = path.join(__dirname, "public", req.url || "");
        this.serveFile(res, filePath);
      }
    });

    // Initialize WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });
    this.setupWebSocketEvents();
  }

  // Serve static files
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
          case ".js": contentType = "text/javascript"; break;
          case ".css": contentType = "text/css"; break;
          case ".json": contentType = "application/json"; break;
          case ".png": contentType = "image/png"; break;
          case ".jpg":
          case ".jpeg": contentType = "image/jpeg"; break;
          default: contentType = "text/plain";
        }
      }

      res.writeHead(200, { "Content-Type": contentType });
      res.end(data);
    });
  }

  // WebSocket events
  setupWebSocketEvents() {
    this.wss.on("connection", (socket) => {
      const clientId = this.generateUniqueId();
      this.clients.set(clientId, {
        socket,
        lastActivity: new Date(),
        roomId: null,
      });

      console.log(`Client connected: ${clientId}`);

      // Send welcome
      this.sendToClient(clientId, {
        type: "connection",
        content: { id: clientId, message: "Connected to server" },
        sender: "server",
        timestamp: Date.now(),
      });

      // Handle messages
      socket.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          const client = this.clients.get(clientId);
          if (client) client.lastActivity = new Date();

          switch (message.type) {
            case "join_room":
              this.handleJoinRoom(clientId, message.roomId);
              break;

            case "leave_room":
              this.handleLeaveRoom(clientId);
              break;

            case "chat":
              this.handleMessage(clientId, message);
              break;

            default:
              console.log("Unknown message type:", message.type);
          }
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

      // Handle disconnection
      socket.on("close", () => {
        console.log(`Client disconnected: ${clientId}`);
        this.handleLeaveRoom(clientId); // Remove from room
        this.clients.delete(clientId);
      });

      socket.on("error", (error) => {
        console.error(`Error with client ${clientId}:`, error);
        this.handleLeaveRoom(clientId);
        this.clients.delete(clientId);
      });
    });
  }

  // Join room
  handleJoinRoom(clientId, roomId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from previous room if exists
    if (client.roomId) this.handleLeaveRoom(clientId);

    client.roomId = roomId;
    if (!this.rooms.has(roomId)) this.rooms.set(roomId, new Set());
    this.rooms.get(roomId).add(clientId);

    // Broadcast updated user list to room
    this.broadcastRoomUserList(roomId);
  }

  // Leave room
  handleLeaveRoom(clientId) {
    const client = this.clients.get(clientId);
    if (!client || !client.roomId) return;

    const roomId = client.roomId;
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(clientId);
      this.broadcastRoomUserList(roomId);

      // Delete room if empty
      if (this.rooms.get(roomId).size === 0) this.rooms.delete(roomId);
    }
    client.roomId = null;
  }

  // Broadcast online users in room
  broadcastRoomUserList(roomId) {
    if (!this.rooms.has(roomId)) return;

    const users = Array.from(this.rooms.get(roomId));
    const message = {
      type: "user_list",
      onlineUsers: users,
      timestamp: Date.now(),
      sender: "server",
    };

    users.forEach((clientId) => {
      this.sendToClient(clientId, message);
    });
  }

  // Handle chat message
  handleMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.roomId) return;

    const roomClients = this.rooms.get(client.roomId);
    if (!roomClients) return;

    roomClients.forEach((id) => {
      this.sendToClient(id, message);
    });
  }

  // Send to single client
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Generate unique client ID
  generateUniqueId() {
    return `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start server
  start() {
    this.server.listen(this.PORT, () => {
      console.log(`WebSocket Server running on port ${this.PORT}`);
    });

    setInterval(() => this.checkInactiveConnections(), 30000);
  }

  // Remove inactive clients
  checkInactiveConnections() {
    const now = new Date();
    const timeout = 5 * 60 * 1000;

    this.clients.forEach((client, clientId) => {
      if (now - client.lastActivity > timeout) {
        console.log(`Client ${clientId} timed out`);
        client.socket.terminate();
        this.handleLeaveRoom(clientId);
        this.clients.delete(clientId);
      }
    });
  }
}

// Start the server
const wsServer = new WebSocketServer();
wsServer.start();

module.exports = WebSocketServer;
