"use client";

import React, { useState } from "react";
import SidebarChat from "./SidebarChat";

export default function SidebarWrapper() {
  // simple local state supaya langsung working tanpa tergantung store
  const [chats, setChats] = useState([
    { id: 1, title: "Chat Baru", last_message: "Halo, aku di tingkat: SD! hai" },
    { id: 2, title: "Sesi Belajar", last_message: "Jadwal Ujian 12 September 2024, Pukul 10.00" },
    { id: 3, title: "Belajar AI", last_message: "Jadwal Belajar AI jam 17:00" },
  ]);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);

  const handleNewChat = () => {
    const id = Date.now();
    const newChat = { id, title: "Chat Baru", last_message: "" };
    setChats((s) => [newChat, ...s]);
    setCurrentChatId(id);
  };

  const handleSelectChat = (chatId: number) => {
    setCurrentChatId(chatId);
    // kalau mau load messages, panggil store atau API di sini
  };

  return (
    <SidebarChat
      chats={chats}
      currentChatId={currentChatId}
      handleSelectChat={handleSelectChat}
      handleNewChat={handleNewChat}
    />
  );
}
