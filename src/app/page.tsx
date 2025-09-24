"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "./store/chatStore";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import * as Separator from "@radix-ui/react-separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useGoogleCalendarToken } from "@/src/lib/useGoogleCalendarToken";
import { createCalendarEvent } from "@/src/lib/createCalendarEvent";
import CalendarConnectButton from "@/src/components/app-components/CalendarConnectButton";


export default function Page() {
  const [input, setInput] = useState("");
  const [educationLevel, setEducationLevel] = useState("SD");

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
  const { accessToken } = useGoogleCalendarToken();
  const scrollRef = useRef<HTMLDivElement | null>(null);


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

  // Debug accessToken changes
  useEffect(() => {
    console.log("Access token in page.tsx:", accessToken);
    console.log("Access token from localStorage:", localStorage.getItem('google_access_token'));
  }, [accessToken]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    setInput("")
    let chatId = currentChatId;

    // Jika belum ada chat yang aktif, wajib membuat/ memilih chat terlebih dahulu
    if (!chatId) {
      alert('Pilih atau buat chat terlebih dahulu');
      return;
    }

    // Tambahkan prefix level pendidikan ke pesan
    const educationPrefix = educationLevel ? `[Halo, aku di tingkat: ${educationLevel}]\n` : '';
    const messageWithEducation = educationPrefix + input;

    // List keyword untuk trigger calendar
    const ListCalendarMessages = [
      "buat jadwal",
      "jadwalkan",
      "kalendar",
      "meeting",
      "jadwal",
      "schedule",
    ]

    const getRelativeDate = (keyword: string) => {
      const today = new Date();
      if (keyword === "hari ini") {
        return today.toISOString().slice(0, 10);
      }
      if (keyword === "besok") {
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
      }
      if (keyword === "lusa") {
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(today.getDate() + 2);
        return dayAfterTomorrow.toISOString().slice(0, 10);
      }
      return null;
    };

    // Deteksi intent 
    if (ListCalendarMessages.some(keyword => input.toLowerCase().includes(keyword))) {
      const token = accessToken || localStorage.getItem('google_access_token');
      if (!token) {
        alert("❌ Silakan connect ke Google Calendar terlebih dahulu dengan klik tombol 'Connect Google Calendar'");
        return;
      }

      // Parse title from user message - extract what's between "jadwal" and "pada"
      const titleMatch = input.match(/jadwal (.+?) pada/i);
      const eventTitle = titleMatch ? titleMatch[1].trim() : "Belajar bareng AI";

      // Parse date from user message
      const relativeDateMatch = input.match(/hari ini|besok|lusa/i);
      const dateWithMonthNameMatch = input.match(/(?:tanggal|pada)?\s?(\d{1,2})\s(\w+)/i);
      const numericDateMatch = input.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
      let eventDate : string;
      let year = new Date().getFullYear().toString();

      // Objek bulan dengan variasi singkatan
      const monthMap: { [key: string]: string } = {
        'januari': '01', 'februari': '02', 'maret': '03', 'april': '04',
        'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08',
        'september': '09', 'oktober': '10', 'november': '11', 'desember': '12',
        'january': '01', 'february': '02', 'march': '03',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
         'october': '10', 'december': '12',
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
          
      if (relativeDateMatch) {
        const relativeDate = getRelativeDate(relativeDateMatch[0].toLowerCase());
        eventDate = relativeDate !== null ? relativeDate : new Date().toISOString().slice(0, 10);
      } else if (dateWithMonthNameMatch) {
        const day = dateWithMonthNameMatch[1].padStart(2, '0');
        const monthName = dateWithMonthNameMatch[2].toLowerCase();
        const month = monthMap[monthName];

        if (month) {
          eventDate = `${year}-${month}-${day}`;
        } else {
          eventDate = new Date().toISOString().slice(0, 10); // Fallback jika nama bulan tidak valid
        }
      } else if (numericDateMatch) {
        const day = numericDateMatch[1].padStart(2, '0');
        const month = numericDateMatch[2].padStart(2, '0');
        
        if (numericDateMatch[3]) {
          year = numericDateMatch[3].length === 2 ? `20${numericDateMatch[3]}` : numericDateMatch[3];
        }
        eventDate = `${year}-${month}-${day}`;
      } else {
        // Default fallback jika tidak ada format yang cocok
        eventDate = new Date().toISOString().slice(0, 10);
      }

      // Parse time range from user message - handle both formats: "08.00 - 10.00" and "8 - 10"
      const timeMatch = input.match(/pukul (\d{1,2})(?:\.(\d{1,2}))? ?- ?(\d{1,2})(?:\.(\d{1,2}))?/i);
      let startTime = "10:00:00";
      let endTime = "11:00:00";

      if (timeMatch) {
        const startHour = timeMatch[1].padStart(2, '0');
        const startMinute = timeMatch[2] ? timeMatch[2].padStart(2, '0') : "00";
        const endHour = timeMatch[3].padStart(2, '0');
        const endMinute = timeMatch[4] ? timeMatch[4].padStart(2, '0') : "00";

        startTime = `${startHour}:${startMinute}:00`;
        endTime = `${endHour}:${endMinute}:00`;
      }

      try {
        const res = await createCalendarEvent(token, {
          title: eventTitle,
          description: input,
          start: `${eventDate}T${startTime}+07:00`,
          end: `${eventDate}T${endTime}+07:00`,
          timezone: "Asia/Jakarta",
        });

        if (res.success) {
          alert(`✅ Jadwal berhasil ditambahkan ke Google Calendar untuk tanggal ${eventDate} pukul ${startTime} - ${endTime}!`);
        } else {
          alert("❌ Gagal menambahkan jadwal: " + res.error);
        }
      } catch (error) {
        alert("❌ Terjadi kesalahan saat menambahkan jadwal: " + (error as Error).message);
      }
    }

    // 2️⃣ Tetap kirim ke AI
    await sendMessage(messageWithEducation, chatId);
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

  const handleQuickMessage = async (message: string) => {
    if (!currentChatId) {
      alert('Pilih atau buat chat terlebih dahulu');
      return;
    }

    // Tambahkan prefix level pendidikan ke pesan
    const educationPrefix = educationLevel ? `[Halo, aku di tingkat: ${educationLevel}]\n` : '';
    const messageWithEducation = educationPrefix + message;

    await sendMessage(messageWithEducation, currentChatId);
  };

  return (
    <div className="flex w-full h-screen">
      {/* Sidebar - Daftar Chat */}
      <div className="w-64 border-r bg-gray-50 flex flex-col">
        <div className="p-3 border-b">
          <button
            onClick={handleNewChat}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
          >
            + Chat Baru
          </button>
        </div>

        <ScrollArea.Root className="flex-1">
          <ScrollArea.Viewport className="h-full w-full p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`p-3 mb-2 rounded-lg cursor-pointer text-sm hover:bg-gray-100 ${
                  currentChatId === chat.id ? 'bg-gray-200' : ''
                }`}
              >
                <div className="font-medium truncate">{chat.title}</div>
                {chat.last_message && (
                  <div className="text-gray-500 text-xs mt-1 truncate">
                    {chat.last_message}
                  </div>
                )}
              </div>
            ))}
          </ScrollArea.Viewport>
        </ScrollArea.Root>
      </div>

      {/* Area Chat */}
      <div className="flex-1 flex flex-col">
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

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 flex gap-2 border-t bg-white"
        >
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
