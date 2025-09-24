  // app/api/chat/gemini/route.ts
  import { google } from "@ai-sdk/google";
  import { streamText } from "ai";
  import { NextResponse } from "next/server";
  import { db } from "@/src/lib/db";
  import { createCalendarEvent } from "@/src/lib/createCalendarEvent";

  export const maxDuration = 30;

  export async function POST(req: Request) {
    try {
      const { message, chatId, educationLevel } = await req.json();

      if (!chatId) {
        return NextResponse.json({ error: "chatId diperlukan" }, { status: 400 });
      }

      // Simpan pesan user ke DB
      await db.execute(
        "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
        [chatId, "user", message]
      );

      // Ambil riwayat percakapan
      const [rows]: any = await db.query(
        "SELECT role, content FROM message WHERE chat_id = ? ORDER BY id ASC",
        [chatId]
      );

      // Mapping DB messages ke format model
      const messages = rows.map((m: any) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      // Tambahkan prompt (konteks) sebagai system role
      messages.unshift({
        role: "system",
        content: `Kamu adalah tutor AI yang menjelaskan sesuai tingkat pendidikan ${educationLevel}. Gunakan bahasa yang cocok untuk siswa di tingkat tersebut.`
      });

      // Jalankan AI SDK
      const result = streamText({
        model: google(process.env.GEMINI_MODEL || "models/gemini-1.5-flash"),
        messages
      });

      // Ambil teks final
      const replyText = await result.text;

      // Simpan balasan AI ke DB
      await db.execute(
        "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
        [chatId, "ai", replyText]
      );

      return NextResponse.json({ reply: replyText });
    } catch (error) {
      console.error("Error in Gemini chat:", error);
      return NextResponse.json(
        { reply: "Terjadi kesalahan dalam memproses permintaan." },
        { status: 500 }
      );
    }
  }

