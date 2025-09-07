
import { useState, useEffect, useRef } from "react";

const ChatRoom = ({ roomId, username, onLeaveRoom }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: "System", text: "Welcome to the chat room!", timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(1); 
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    // Initialize socket
  socketRef.current = new WebSocket(import.meta.env.VITE_WS_URL);

    // Ensure messages are sent only after connection is open
    socketRef.current.onopen = () => {
      console.log("WebSocket connected");

      // Join the room
      socketRef.current.send(
        JSON.stringify({ type: "join_room", roomId, username })
      );
    };

    // Listen for server messages
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "chat":
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: data.sender,
              text: data.content,
              timestamp: new Date(data.timestamp),
            },
          ]);
          break;

        case "user_list":
          setOnlineUsers(data.onlineUsers.length);
          break;

        case "user_joined":
          setOnlineUsers(data.onlineUsers.length);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "System",
              text: `${data.username} joined the room`,
              timestamp: new Date(),
            },
          ]);
          break;

        case "user_left":
          setOnlineUsers(data.onlineUsers.length);
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now(),
              sender: "System",
              text: `${data.username} left the room`,
              timestamp: new Date(),
            },
          ]);
          break;

        default:
          break;
      }
    };

    return () => {
      // Leave room on unmount
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: "leave_room", roomId }));
      }
      socketRef.current?.close();
    };
  }, [roomId, username]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "chat",
          content: newMessage,
          sender: username,
          timestamp: Date.now(),
        })
      );
      setNewMessage("");
    }
  };

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex flex-col h-screen w-full bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 bg-[#111111] shadow-md">
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">Room-Id: {roomId}</h2>
          <span className="text-sm opacity-80">{onlineUsers} users online</span>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-400">Chatify</h1>
        </div>

        <button
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          onClick={onLeaveRoom}
        >
          Leave Room
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-[#111111]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col max-w-[75%] ${
              message.sender === username
                ? "self-end items-end"
                : message.sender === "System"
                ? "self-center items-center"
                : "items-start"
            }`}
          >
            {message.sender !== username && message.sender !== "System" && (
              <div className="text-xs text-gray-400 mb-1 ml-2">{message.sender}</div>
            )}
            <div
              className={`px-4 py-2 rounded-2xl shadow ${
                message.sender === "System"
                  ? "bg-[#1a1a1a] text-gray-300 text-sm text-center"
                  : message.sender === username
                  ? "bg-indigo-600 text-white rounded-tr-sm"
                  : "bg-[#222222] text-white rounded-tl-sm"
              }`}
            >
              <div className="mb-1">{message.text}</div>
              <div className="text-[10px] opacity-70 text-right">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border-t border-gray-700"
        onSubmit={handleSendMessage}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-full bg-[#111111] text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="w-11 h-11 rounded-full flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-5 h-5"
          >
            <path d="M22 2L11 13"></path>
            <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
          </svg>
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
