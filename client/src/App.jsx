

import { useState } from "react";
import RoomEntry from "./components/RoomEntry";
import ChatRoom from "./components/ChatRoom";
import './index.css'

const App = () => {
  const [room, setRoom] = useState(null);
  const [username, setUsername] = useState("");

  const handleJoinRoom = (roomId, user) => {
    setRoom(roomId);
    setUsername(user);
  };

  const handleLeaveRoom = () => {
    setRoom(null);
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      {!room ? (
        <RoomEntry onJoinRoom={handleJoinRoom} />
      ) : (
        <ChatRoom roomId={room} username={username} onLeaveRoom={handleLeaveRoom} />
      )}
    </div>
  );
};

export default App;
