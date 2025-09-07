import { useState } from "react";

const RoomEntry = ({ onJoinRoom }) => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomId.trim() && username.trim()) {
      onJoinRoom(roomId, username);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    setIsCreating(true);
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-[#0a0a0a] p-5">
      <div className="bg-[#111111] rounded-xl shadow-md w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <h1 className="text-indigo-400 text-4xl font-bold mr-2">Chatify</h1>
          <div className="w-10 h-10 text-indigo-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M2 12h4c4 0 2-8 6-8s2 8 6 8 2-8 6-8 2 8 6 8h2"></path>
            </svg>
          </div>
        </div>

        {/* Toggle Buttons */}
        <div className="flex mb-6 rounded-lg overflow-hidden bg-[#1a1a1a]">
          <button
            type="button"
            className={`flex-1 py-3 font-medium transition ${
              !isCreating
                ? "bg-indigo-500 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            onClick={() => setIsCreating(false)}
          >
            Join Room
          </button>
          <button
            type="button"
            className={`flex-1 py-3 font-medium transition ${
              isCreating
                ? "bg-indigo-500 text-white"
                : "text-gray-400 hover:bg-gray-800"
            }`}
            onClick={() => setIsCreating(true)}
          >
            Create Room
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Username */}
          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="font-medium text-gray-300">
              Your Name
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name"
              required
              className="px-4 py-3 border border-gray-700 rounded-lg bg-[#1a1a1a] text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Room ID */}
          <div className="flex flex-col gap-2">
            <label htmlFor="roomId" className="font-medium text-gray-300">
              {isCreating ? "New Room ID" : "Room ID"}
            </label>
            <div className="flex">
              <input
                type="text"
                id="roomId"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder={isCreating ? "Auto-generated room ID" : "Enter room ID"}
                readOnly={isCreating}
                required
                className="flex-1 px-4 py-3 border border-gray-700 rounded-l-lg bg-[#1a1a1a] text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {isCreating && (
                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="px-4 bg-indigo-400 text-white font-medium rounded-r-lg hover:bg-indigo-500 transition"
                >
                  Generate
                </button>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="bg-indigo-500 text-white py-3 rounded-lg font-semibold hover:bg-indigo-600 transition"
          >
            {isCreating ? "Create & Join" : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoomEntry;
