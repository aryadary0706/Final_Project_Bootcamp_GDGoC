  import { google } from "@ai-sdk/google";
  import { generateText } from "ai";
  import { NextResponse } from "next/server";
  import { db } from "@/src/lib/db";
  import { z } from "zod";
  import { searchYouTube } from "@/src/lib/youtube";
  import { createCalendarEvent, type EventInput } from "@/src/lib/createCalendarEvent";

  export const maxDuration = 60;

  export async function POST(req: Request) {
    // --- TANGGAL SAAT INI ---
    // Dapatkan tanggal dan waktu saat ini di zona waktu 'Asia/Jakarta'
    const now = new Date();
    const currentDateTime = now.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta',
        timeZoneName: 'short',
    });
    try {
      const { message, chatId, educationLevel, googleAccessToken } = await req.json();

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

      // System prompt untuk AI
      const systemPrompt = `
        # PERAN
        - Kamu adalah **Study Buddy**, AI edukatif yang menjadi teman belajar di semua jenjang pendidikan.
        - Gaya komunikasimu: sederhana, ramah, sabar, tenang, dan mudah dipahami.
        - Konsisten hadir seperti teman belajar yang siap menemani kapan saja.

        # TUJUAN
        - Menjelaskan topik pendidikan dengan cara yang jelas, bertahap, dan relevan.
        - Memberikan strategi belajar, refleksi, soal latihan, flashcard, atau penguatan sesuai kebutuhan.
        - Membantu mengelola waktu belajar dengan membuat jadwal via tools kalender.
        - Mendukung pengguna dengan saran sumber belajar (misalnya video/visual) bila diperlukan.

        # GAYA BAHASA
        - Sesuaikan bahasa dengan tingkat pendidikan pengguna: ${educationLevel}.
        - Sering tambahkan kalimat penyemangat, misalnya:
          - “Semoga penjelasan ini membantu ya.”
          - “Pertanyaan kamu bagus banget, terima kasih sudah nanya.”

        # ATURAN TOOL CALLING
        1. **YouTube / Video / Media / Visual**
          - Jika pengguna minta video (kata kunci: "youtube", "video", "rekomendasi video", "media", "visual"):
            - Gunakan tool \`searchYouTube\`.
            - Jangan pernah memberi link manual.
            - Sertakan hasil video langsung di jawaban pertama kali.

        2. **Jadwal / Kalender / Event**
          - Jika pengguna minta membuat jadwal (kata kunci: "jadwalkan", "buatkan jadwal", "kalender", "event"):
            - Gunakan tool \`createCalendarEvent\`.
            - **Konteks waktu saat ini:** ${currentDateTime}.
            - Jika tidak ada tanggal pasti → jadwalkan **besok**.
            - Jika tidak ada jam → default **09:00 pagi**.
            - Default durasi: **1 jam**.
            - Jika judul acara tidak jelas → tanyakan kembali sebelum menggunakan tool.

        3. **Dokumen**
          - Jika pengguna mengunggah dokumen → analisis isi sesuai permintaan mereka.

        # OUTPUT
        - Penjelasan harus jelas, ramah, dan mudah dipahami.
        - Selalu tawarkan strategi belajar, refleksi, atau latihan praktis.
        - Jika ada kebutuhan tools (video/jadwal) → langsung lakukan tool calling sesuai aturan.
        `;
      console.log("Token saat ini:", googleAccessToken);
      const model =  google("gemini-2.5-flash");
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
                execute: async ({ query }) => {
                  const finalQuery = query?.trim?.() || message;
                  return await searchYouTube(finalQuery);
                },
              },
              createCalendarEvent: {
                description: "Buat acara baru di kalender pengguna",
                inputSchema: z.object({
                  summary: z.string().describe("Judul singkat acara"),
                  description: z.string().optional().describe("Deskripsi detail acara"),
                  start: z.string().describe("Waktu mulai acara dalam format ISO 8601 atau RFC 3339, misalnya: '2025-09-28T10:00:00+07:00' atau '2025-09-28T17:00:00Z'"),
                  end: z.string().describe("Waktu selesai acara dalam format ISO 8601 atau RFC 3339"),
                  timezone: z.string().optional().describe("Zona waktu acara, e.g., 'Asia/Jakarta'"),
                }),
                execute: async (input: EventInput) => {
                  const accessToken = googleAccessToken
                  if (!accessToken){
                    console.log("Masuk gemini")
                    return "ERROR: Token akses Google Calendar tidak tersedia. Mohon otentikasi ulang untuk membuat jadwal.";
                  }
                  return await createCalendarEvent(accessToken, input);
                }
              }
            },
      });

      let replyText = await result.text;
      let videos: any[] = [];

      // Proses hasil dari tool jika tool dipanggil
      if (result.toolResults && result.toolResults.length > 0) {
          const youtubeToolResult = result.toolResults.find(
            (tr:any) => tr.toolName === "searchYouTube"
          );
          if (youtubeToolResult && youtubeToolResult.output) {
            videos = youtubeToolResult.output;
            const videoTexts = videos
              .map((v: any) => `Judul: \n${v.title}\nLink:\n ${v.url}`)
              .join("\n\n");
            replyText += `\n\nIni video yang mungkin bisa membantumu:\n\n${videoTexts}`;
          }
          
          const calendarToolResult = result.toolResults.find(
            (tr:any) => tr.toolName === "createCalendarEvent"
          );
          if (calendarToolResult?.output?.success){
            const ApiRouteOutput = calendarToolResult.output.data;
            if (ApiRouteOutput?.success && ApiRouteOutput?.data){
              const event = ApiRouteOutput.data;
              const startTime = event.start?.dateTime || event.start?.date;
              const endTime = event.end?.dateTime || event.end?.date;

              replyText += `\n\n✅ Acara berhasil dibuat di kalender:\n- Judul: ${event.summary || "Tidak ada judul"}\n- Waktu: ${formatTime(startTime)} - ${formatTime(endTime)}\n- Lihat Jadwal: ${event.htmlLink}`;
            }else if (calendarToolResult?.output?.success === false) {
              replyText += `\n\n❌ Gagal membuat acara di kalender. Pesan Error: ${calendarToolResult.output.error}`;
            }else if (typeof calendarToolResult?.output === 'string') {
                replyText += `\n\n❌ Gagal membuat acara di kalender. Pesan Error: ${calendarToolResult.output}`;
            }
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

  function formatTime(isoString: string): string {
  // Jika ini adalah event sepanjang hari (hanya tanggal, misal '2024-11-22')
  if (isoString.length <= 10) { 
    return new Date(isoString).toLocaleDateString('id-ID', {
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  // Jika ini adalah event berwaktu (ISO 8601)
  const date = new Date(isoString);
  
  // Opsi pemformatan yang rapi:
  const options: Intl.DateTimeFormatOptions = {
    // Tanggal
    day: 'numeric', 
    month: 'short', 
    year: 'numeric',
    // Waktu
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false, // Gunakan format 24 jam
    // Zona Waktu (penting untuk +07:00)
    timeZoneName: 'short' // Contoh: WIB
  };

  // Format ke bahasa Indonesia (id-ID)
  return date.toLocaleTimeString('id-ID', options);
}