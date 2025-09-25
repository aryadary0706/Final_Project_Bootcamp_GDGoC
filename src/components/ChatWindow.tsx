"use client";

type Message = {
  text: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export default function ChatWindow({ chat }: { chat?: Chat }) {
  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Pilih chat atau buat chat baru untuk memulai
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-4 overflow-y-auto">
        {chat.messages.length === 0 ? (
          <p className="text-gray-500">Belum ada pesan</p>
        ) : (
          chat.messages.map((m, i) => (
            <div key={i} className="mb-2">
              {m.text}
            </div>
          ))
        )}
      </div>
      <div className="p-2 border-t">
        <input
          type="text"
          placeholder="Ketik pesan..."
          className="border p-2 rounded w-full"
        />
      </div>
    </div>
  );
}
