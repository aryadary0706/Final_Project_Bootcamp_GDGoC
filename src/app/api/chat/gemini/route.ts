// app/api/chat/gemini/route.ts
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db"; // Sesuaikan dengan lokasi file db Anda

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, chatId } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "chatId diperlukan" }, { status: 400 });
    }

    // Simpan pesan user ke database
    await db.execute(
      "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "user", message]
    );

    // Ambil seluruh riwayat percakapan berdasarkan chatId
    const [rows]: any = await db.query(
      "SELECT role, content FROM message WHERE chat_id = ? ORDER BY id ASC",
      [chatId]
    );

    // Ubah riwayat ke format Gemini
    const contents = rows.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    // Panggil API Gemini dengan riwayat lengkap
    const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
      }
    );

    const data = await response.json();

    const aiMessage =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Maaf, saya tidak bisa menjawab sekarang.";

    // Simpan response AI ke database
    await db.execute(
      "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "assistant", aiMessage]
    );

    return NextResponse.json({ reply: aiMessage });
  } catch (error) {
    console.error("Error in Gemini chat:", error);
    return NextResponse.json(
      { reply: "Terjadi kesalahan dalam memproses permintaan." },
      { status: 500 }
    );
  }
}