"use client";

import { useRef, useEffect, useState } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paperclip, Trash2, FileText, X } from "lucide-react";
import { useChatStore } from "../../app/store/chatStore";

interface ChatWindowProps {
  messages: Array<{
    id?: number;
    role: string;
    content: string;
    created_at?: string;
    files?: Array<{
      name: string;
      size: number;
      type: string;
      url?: string;
    }>;
  }>;
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  currentChatId: number | null;
  educationLevel: string;
  onEducationLevelChange: (level: string) => void;
  accessToken?: string;
  onFileUploaded?: (fileName: string) => void;
}

export default function ChatWindow({
  messages,
  isLoading,
  input,
  onInputChange,
  onSend,
  currentChatId,
  educationLevel,
  onEducationLevelChange,
  accessToken,
  onFileUploaded,
}: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const { uploadedFiles, uploadFile, removeUploadedFile, clearUploadedFiles } = useChatStore();

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleUploadClick = () => {
    if (currentChatId) {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentChatId) return;

    setUploadStatus('Uploading...');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadStatus(`Uploaded: ${file.name}`);
        onFileUploaded?.(result.fileName || file.name);
      } else {
        setUploadStatus('Upload failed');
      }
    } catch (error) {
      setUploadStatus('Upload error');
      console.error('Upload error:', error);
    }

    // Reset input
    event.target.value = '';
    // Clear status after 3 seconds
    setTimeout(() => setUploadStatus(null), 3000);
  };

  const handleDeleteDocument = () => {
    // Implement delete functionality - for now, alert as placeholder
    // You can extend this to call a delete API or remove from store
    if (confirm('Are you sure you want to delete the uploaded document?')) {
      setUploadStatus('Document deleted');
      // Add delete logic here, e.g., call /api/chat/delete or clear from store
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Education Level Dropdown */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-600">StudyBuddy</span>
          {/* CalendarConnectButton would go here if needed */}
        </div>
        <select
          value={educationLevel}
          onChange={(e) => onEducationLevelChange(e.target.value)}
          className="border rounded-md px-2 py-1 text-sm"
          disabled={!currentChatId}
        >
          <option value="SD">SD</option>
          <option value="SMP">SMP</option>
          <option value="SMA">SMA</option>
          <option value="Kuliah">Kuliah</option>
        </select>
      </div>

      {/* AREA CHAT */}
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport
          ref={scrollRef}
          className="h-full w-full p-4 space-y-3"
        >
          {uploadStatus && (
            <div className="p-2 bg-blue-50 border rounded text-sm text-blue-700 mb-2">
              {uploadStatus}
            </div>
          )}
          {isLoading ? (
            <div className="text-center text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              {currentChatId
                ? "Belum ada pesan. Mulai percakapan!"
                : "Pilih chat atau buat chat baru untuk memulai"
              }
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={msg.id != null ? `db-${msg.id}` : `ui-${msg.created_at ?? i}`}
                className={`my-3 max-w-[80%] ${
                  msg.role === "user" ? "ml-auto" : "mr-auto"
                }`}
              >
                {/* Message Header */}
                <div
                  className={`text-md font-medium mb-1 ${
                    msg.role === "user"
                      ? "text-right text-blue-600"
                      : "text-left text-gray-600"
                  }`}
                >
                  {msg.role === "user" ? "User" : "StudyBot"}
                </div>

                {/* Message Content */}
                <div
                  className={`p-3 rounded-xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  {msg.role === "user" ? (
                    <div>{msg.content}</div>
                  ) : (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          orientation="vertical"
          className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-150 ease-out hover:bg-gray-200"
        >
          <ScrollArea.Thumb className="flex-1 rounded-full bg-gray-400" />
        </ScrollArea.Scrollbar>
        <ScrollArea.Corner className="bg-gray-200" />
      </ScrollArea.Root>

      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* INPUT CHAT */}
      <div className="p-3 border-t bg-white flex items-center gap-2">
        {/* Upload Document - Paperclip Icon (leftmost, like GPT) */}
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          onClick={handleUploadClick}
          disabled={!currentChatId}
          title="Upload Document"
        >
          <Paperclip size={20} className="text-gray-500" />
        </button>

        {/* Delete Document - Trash Icon */}
        <button
          className="p-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
          onClick={handleDeleteDocument}
          disabled={!currentChatId}
          title="Delete Document"
        >
          <Trash2 size={20} className="text-red-500" />
        </button>

        {/* INPUT FIELD */}
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            currentChatId
              ? "Jelasin apa kesulitanmu dalam belajar..."
              : "Klik + Chat Baru untuk memulai"
          }
          className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={!currentChatId}
        />

        {/* SEND BUTTON */}
        <button
          onClick={onSend}
          disabled={!input.trim() || !currentChatId}
          className="px-4 py-2 rounded-full border bg-blue-500 hover:bg-blue-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
