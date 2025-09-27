"use client";

import { useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadFile: (file: File) => void;
}

export default function ChatInput({ onSendMessage, onUploadFile }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) setFile(e.target.files[0]);
  };

  const handleSend = () => {
    if (file) {
      onUploadFile(file);
      setFile(null);
    }
    if (message.trim()) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <div className="border-t p-3 bg-white">
      {file && (
        <div className="mb-2 p-2 text-sm flex items-center justify-between bg-gray-100 rounded-lg">
          <span>📄 {file.name}</span>
          <button
            onClick={() => setFile(null)}
            className="text-red-500 hover:underline text-xs"
          >
            ✖
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="cursor-pointer p-2 bg-gray-200 rounded-xl hover:bg-gray-300">
          📎
          <input type="file" onChange={handleFileChange} className="hidden" />
        </label>

        <input
          type="text"
          placeholder="Ketik pesan..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 p-2 border rounded-xl focus:outline-none"
        />

        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
