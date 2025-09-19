// app/api/chat/gemini/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Sesuaikan dengan lokasi file db Anda
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { ModelMessage } from "ai";
import { streamText } from "ai";

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

    // Konversi ke format CoreMessage untuk Vercel AI SDK
    const history = rows.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    // Inisialisasi Google Generative AI (Gemini)
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const model = google(process.env.GEMINI_MODEL || "gemini-1.5-flash");

    // Tentukan system prompt (meta prompt) Anda di sini
    const systemPrompt = `
      Anda adalah asisten AI yang sangat membantu, sopan, dan informatif.
      Jawablah dengan singkat dan jelas. Jika tidak tahu, katakan "Saya tidak tahu".
      Hindari jawaban yang terlalu panjang atau bertele-tele.
    `;

    // Generate response dengan riwayat + system prompt
    const result = await streamText({
      model,
      system: systemPrompt, // <-- Meta prompt disisipkan di sini
      messages: history,    // <-- Riwayat dari database
    });

    // Ambil full response text (karena streamText bisa di-stream, tapi kita ambil full)
    let aiMessage = "";
    for await (const delta of result.textStream) {
      aiMessage += delta;
    }

    // Jika kosong, beri fallback
    if (!aiMessage.trim()) {
      aiMessage = "Maaf, saya tidak bisa menjawab sekarang.";
    }

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