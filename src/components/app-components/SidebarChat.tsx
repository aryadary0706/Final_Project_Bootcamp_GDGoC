"use client";

import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Button } from "../ui/button";

interface SidebarChatProps {
  chats: { id: number; title: string; last_message?: string }[];
  currentChatId: number | null;
  handleSelectChat: (chatId: number) => void;
  handleNewChat: () => void;
  handleUploadFile: (file: File) => void;
}

export default function SidebarChat({
  chats,
  currentChatId,
  handleSelectChat,
  handleNewChat,
  handleUploadFile,
}: SidebarChatProps) {
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleUploadFile && e.target.files?.[0]) {
      handleUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-64 h-screen border-r bg-gray-50 flex flex-col">

      {/* Tombol Chat Baru */}
      <div className="p-3 border-b">
        <button
          onClick={handleNewChat}
          className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          + Chat Baru
        </button>
      </div>

      {/* Daftar Chat Scrollable - dengan max height yang tetap */}
      <div className="flex-1 min-h-0">
        <ScrollArea.Root className="h-full">
          <ScrollArea.Viewport className="h-full w-full p-2 space-y-2">
            {chats.length === 0 && (
              <div className="text-gray-400 text-center text-sm mt-4">Belum ada chat</div>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`p-3 rounded-lg cursor-pointer text-sm hover:bg-gray-100 ${
                  currentChatId === chat.id ? "bg-gray-200" : ""
                }`}
              >
                <div className="font-medium truncate">{chat.title}</div>
                {chat.last_message && (
                  <div className="text-gray-500 text-xs mt-1 truncate">{chat.last_message}</div>
                )}
              </div>
            ))}
          </ScrollArea.Viewport>

          {/* Scrollbar */}
          <ScrollArea.Scrollbar
            orientation="vertical"
            className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200"
          >
            <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-full" />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>
      </div>

      {/* Upload Button at the bottom */}
      <div className="p-3 border-t">
        <Button
          onClick={() => document.getElementById('file-upload')?.click()}
          variant="secondary"
          className="w-full"
        >
          Upload Document
        </Button>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
