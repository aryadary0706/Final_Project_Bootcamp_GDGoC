// app/api/chat/list/route.ts
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db"; // Sesuaikan path dengan lokasi file db Anda

export async function GET() {
  try {
    // Ambil semua chat dengan pesan terakhir
   const [chats] = await db.execute(`
    SELECT 
      c.id,
      c.title,
      c.created_at,
      m.content AS last_message,
      m.created_at AS last_message_time
    FROM chat c 
    LEFT JOIN (
      SELECT mm.* FROM message mm 
    INNER JOIN (
      SELECT chat_id, MAX(created_at) AS max_created FROM message GROUP BY chat_id ) AS x 
      ON mm.chat_id = x.chat_id AND mm.created_at = x.max_created ) AS m 
      ON c.id = m.chat_id ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `) as any;

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar chat" },
      { status: 500 }
    );
  }
}