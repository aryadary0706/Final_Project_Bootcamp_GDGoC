"use client";

type Chat = {
  id: string;
  title: string;
};

export default function ChatList({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
}: {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNewChat}
        className="m-2 p-2 bg-blue-500 text-white rounded-lg"
      >
        + Chat Baru
      </button>

      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 && (
          <p className="text-gray-500 text-center mt-4">
            Belum ada chat
          </p>
        )}

        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-2 cursor-pointer hover:bg-gray-200 ${
              chat.id === currentChatId ? "bg-gray-300" : ""
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            {chat.title}
          </div>
        ))}
      </div>
    </div>
  );
}
