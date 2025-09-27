"use client";

import { useState, useEffect, useRef } from "react";
import { useChatStore } from "./store/chatStore";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Separator from "@radix-ui/react-separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paperclip, X } from "lucide-react";
import { useGoogleCalendarToken } from "@/src/lib/useGoogleCalendarToken";
import CalendarConnectButton from "@/src/components/app-components/CalendarConnectButton";

import { useCalendarStore } from "./store/calendarStore";
import SidebarChat from "@/src/components/app-components/SidebarChat";

export default function Page() {
  const [input, setInput] = useState("");
  const [educationLevel, setEducationLevel] = useState("Kuliah");
  const [uploadedFiles, setUploadedFiles] = useState<Array<{name: string, size: number}>>([]);


  const {
    messages,
    chats,
    currentChatId,
    isLoading,
    loadMessages,
    loadChats,
    createNewChat,
    sendMessage,
    setCurrentChatId
  } = useChatStore();
  const { accessToken } = useCalendarStore();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load chats saat komponen pertama kali dimuat
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
  console.log("🔄 accessToken di Page berubah menjadi:", accessToken);
}, [accessToken]);

  // Debug accessToken changes
  useEffect(() => {
    console.log("Access token in page.tsx:", accessToken);
    console.log("Access token from localStorage:", localStorage.getItem('google_access_token'));
  }, [accessToken]);


  const isCalendarRequest = (text: string) => /jadwal|schedule|calendar|buat.*acara|rencana/i.test(text);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setUploadedFiles(prev => [...prev, { name: file.name, size: file.size }]);
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      alert('Upload error');
    }

    // Reset input
    event.target.value = '';
  };

  const removeUploadedFile = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(file => file.name !== fileName));
  };


  const handleSendMessage = async () => {
    if (!input.trim() && uploadedFiles.length === 0) return;
    setInput("")
    let chatId = currentChatId;

    // Jika belum ada chat yang aktif, wajib membuat/ memilih chat terlebih dahulu
    if (!chatId) {
      alert('Pilih atau buat chat terlebih dahulu');
      return;
    }

    // Jika butuh kalender, pastikan token ada
    if (isCalendarRequest(input) && !accessToken) {
      alert("⚠️ Silakan hubungkan Google Calendar terlebih dahulu sebelum membuat jadwal.");
      return;
    }
    console.log("🚀 Mengirim pesan dengan accessToken:", accessToken);
    let finalMessage =  input
    // Include uploaded files in the message
    if (uploadedFiles.length > 0) {
      const fileList = uploadedFiles.map(file => `- ${file.name}`).join('\n');
      finalMessage += `\n\n[Files uploaded for reference:\n${fileList}]`;
    }

    // 2️⃣ Tetap kirim ke AI
    await sendMessage(finalMessage, chatId, educationLevel, accessToken);
    setUploadedFiles([]);
    setInput("");
  };

  const handleSelectChat = async (chatId: number) => {
    setCurrentChatId(chatId);
    await loadMessages(chatId);
  };

  const handleNewChat = async () => {
    const chatId = await createNewChat();
    if (chatId) {
      setCurrentChatId(chatId);
      // Clear messages untuk chat baru
      useChatStore.setState({ messages: [] });
    }
  };

  return (
    <div className="flex w-full h-screen bg-gray-100">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Sidebar */}
      <SidebarChat
        chats={chats}
        currentChatId={currentChatId}
        handleSelectChat={handleSelectChat}
        handleNewChat={handleNewChat}
      />

      {/* Area Chat */}
      <div className="flex-1 flex flex-col bg-white m-3 rounded-xl shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
    <div className="flex items-center gap-2">

      <span className="font-bold text-blue-600">StudyBuddy</span>
      {/* 🔗 Tambahin tombol connect */}
      <CalendarConnectButton />
    </div>

          {/* Dropdown Level Pendidikan */}
          <select
            value={educationLevel}
            onChange={(e) => setEducationLevel(e.target.value)}
            className="border rounded-md px-2 py-1 text-sm"
          >
            <option value="SD">SD</option>
            <option value="SMP">SMP</option>
            <option value="SMA">SMA</option>
            <option value="Kuliah">Kuliah</option>
          </select>
        </div>

        {/* Chat Messages */}
        <ScrollArea.Root className="flex-1 overflow-hidden">
          <ScrollArea.Viewport
            ref={scrollRef}
            className="h-full w-full p-4 space-y-3"
            style={{ height: "100%" }}
          >
            {isLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                {currentChatId ?
                  "Belum ada pesan. Mulai percakapan!" :
                  "Pilih chat atau buat chat baru untuk memulai"
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

        <Separator.Root className="bg-gray-200 h-px w-full" />

        {/* Uploaded Files Display - GPT Style */}
        {uploadedFiles.length > 0 && (
          <div className="px-3 py-2 border-t bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2 text-sm"
                >
                  <span className="text-gray-700">{file.name}</span>
                  <button
                    onClick={() => removeUploadedFile(file.name)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Remove file"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 flex gap-2 border-t bg-white"
        >
          {/* Upload Document - Paperclip Icon (leftmost, like GPT) */}
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentChatId}
            title="Upload Document"
          >
            <Paperclip size={20} className="text-gray-500" />
          </button>

          <input
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-400"
            value={input}
            placeholder={currentChatId ? "Jelasin apa kesulitanmu dalam belajar..." : "Klik + Chat Baru untuk memulai"}
            onChange={(e) => setInput(e.target.value)}
            disabled={!currentChatId}
          />
          <button
            type="submit"
            disabled={!input.trim() || !currentChatId}
            className="px-4 py-2 rounded-lg border bg-blue-500 hover:bg-blue-600 text-white text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Kirim
          </button>
        </form>
      </div>
    </div>
  );
}