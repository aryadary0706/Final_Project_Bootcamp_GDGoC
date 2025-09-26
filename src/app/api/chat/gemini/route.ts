import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db";
import { z } from "zod";
import { searchYouTube } from "@/src/lib/youtube";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { message, chatId, educationLevel } = await req.json();

    if (!chatId) {
      return NextResponse.json({ error: "chatId diperlukan" }, { status: 400 });
    }

    // Simpan pesan user
    await db.execute(
      "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "user", message]
    );

    // Ambil riwayat pesan dari database
    const [rows]: any = await db.query(
      "SELECT role, content FROM message WHERE chat_id = ? ORDER BY id ASC",
      [chatId]
    );

    const messages = rows.map((m: any) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

    // Deteksi apakah user meminta video
    const asksForVideo = /video|youtube|tonton|lihat|tunjukkan|ada.*video|rekomendasi.*video/i.test(message);

    // System prompt untuk AI
    const systemPrompt = `Kamu adalah tutor AI untuk siswa tingkat ${educationLevel}. Kamu membantu para siswa untuk belajar.

    # RULE:
    - Jika pengguna meminta salah satu pada kata di ${asksForVideo}, KAMU HARUS:
      1. Memberikan penjelasan detail mengenai  topik tersebut.
      2. MENGGUNAKAN tool searchYouTube untuk mencari video.
      3. KAMU HARUS MEMANGGIL FUNGSI searchYouTube — jangan pernah memberikan link manual.
    - Gunakan bahasa yang sesuai untuk usia ${educationLevel}.

    Contoh respons yang baik:
    "HTML adalah bahasa markup dasar untuk membuat halaman web. Berikut video tutorial yang bisa kamu tonton:"
    `;
    const model =  google("gemini-2.5-flash");
    console.log("Model ID yang akan digunakan di SDK:", model);
    // Panggil model dengan tool yang relevan jika diperlukan
    const result = await generateText({
      model: model,
      system: systemPrompt,
      messages,
      tools:{
            searchYouTube: {
              description: "Cari video YouTube yang relevan berdasarkan query",
              inputSchema: z.object({
                query: z.string().describe("Kata kunci pencarian YouTube"),
              }),
              execute: async ({ query }: { query: string }) => {
                return await searchYouTube(query?.trim() || message);
              },
            },
          },
    });

    let replyText = result.text;
    let videos: any[] = [];

    // Proses hasil dari tool jika tool dipanggil
    if (result.toolResults && result.toolResults.length > 0) {
      const youtubeToolResult = result.toolResults.find(
        (tr) => tr.toolName === "searchYouTube"
      );
      if (youtubeToolResult && youtubeToolResult.output) {
        videos = youtubeToolResult.output;
        const videoTexts = videos
          .map((v: any) => `Judul: \n${v.title}\nLink:\n ${v.url}`)
          .join("\n\n");
        replyText += `\n\nIni video yang mungkin bisa membantumu:\n\n${videoTexts}`;
      }
    }

    // Simpan balasan akhir ke database
    await db.execute(
      "INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)",
      [chatId, "ai", replyText]
    );

    return NextResponse.json({ reply: replyText, videos });
  } catch (error) {
    console.error("Error in Gemini chat:", error);
    return NextResponse.json(
      { reply: "Terjadi kesalahan dalam memproses permintaan." },
      { status: 500 }
    );
  }
}
