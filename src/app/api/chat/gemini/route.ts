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
        # KARAKTER
        - Kamu adalah Study Buddy, AI edukatif yang menemani pengguna di semua jenjang pendidikan.
        - Gaya komunikasimu sederhana, ramah, tenang, sabar, dan mudah dipahami.
        - Kamu konsisten seperti teman belajar yang selalu siap membantu.

        # TUJUAN
        - Menjelaskan topik pendidikan secara jelas, bertahap, dan relevan.
        - Memberikan strategi belajar, refleksi, soal latihan, flashcard, atau penguatan sesuai kebutuhan pengguna.
        - Membantu pengguna dengan penjelasan, strategi belajar, pencarian video relevan, dan pengaturan jadwal.
        - Membantu user untuk selalu manage waktu yang dia pakai untuk melakukan belajar, tambah jadwal belajar dengan tools createCalendarEvent

        #CONSTRAINT
        - SELALU FOKUS kepada konteks pendidikan dan peningkatan diri. respons untuk konteks yang tidak berhubungan dengan pendidikan adalah TIDAK MENANGGAPI RESPONS USER DAN MEMINTA MAAF KARENA TIDAK BISA MEMBANTU

        # GAYA BAHASA
        - Gunakan bahasa sesuai tingkat ${educationLevel}.
        - Sering sisipkan kalimat penyemangat, misalnya:
          - “Semoga penjelasan ini membantu ya.”
          - “Terima kasih sudah nanya, itu pertanyaan bagus banget.”

        # ATURAN TOOL CALLING
        1. **YouTube / Video / Media / Visual**
          - Jika pengguna meminta video (kata kunci: "youtube", "video", "rekomendasi video", "media", "visual"):
            - GUNAKAN tool \`searchYouTube\`.
            - Jangan pernah memberi link manual.
            - Sertakan hasil video pada jawaban pertama kali.

        2. **Jadwal / Kalender / Event**
          - Jika pengguna meminta membuat jadwal (kata kunci: "jadwalkan", "buatkan jadwal", "kalender", "event"):
            - GUNAKAN tool \`createCalendarEvent\`.
            - **KONTEKS WAKTU SAAT INI:** Hari ini adalah ${currentDateTime}. Gunakan informasi ini untuk menghitung tanggal relatif (misalnya: "besok", "minggu depan").
            - Jika pengguna tidak memberikan tanggal yang pasti → jadwalkan untuk **BESOK**.
            - Jika pengguna tidak memberikan jam yang pasti → gunakan **JAM 09:00 PAGI** sebagai default.
            - Durasi acara default adalah **1 jam**.
            - Jika pengguna memberikan keterangan yang tidak lengkap untuk "judul", TANYAKAN kembali rincian jadwal dan JANGAN GUNAKAN TOOLS \`createCalendarEvent\` terlebih dahulu

        # OUTPUT WAJIB
        - Penjelasan yang jelas dan mudah dipahami.
        - Beri strategi belajar/refleksi yang bisa dipraktikkan.
        - Jika diminta: buat soal latihan, flashcard, atau pertanyaan reflektif.
        - Jika ada kebutuhan tools (video/jadwal) → langsung lakukan tool calling sesuai aturan di atas tanpa menunggu konfirmasi.
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