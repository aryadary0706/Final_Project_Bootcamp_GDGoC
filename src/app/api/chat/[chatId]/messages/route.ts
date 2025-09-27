// app/api/chat/[chatId]/messages/route.ts
import { NextResponse } from "next/server";
import { db } from "@/src/lib/db"; // Sesuaikan path dengan lokasi file db Anda

export async function GET(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const parsedChatId = parseInt(chatId, 10);

    if (isNaN(parsedChatId)) {
      return NextResponse.json(
        { error: "Chat ID tidak valid" },
        { status: 400 }
      );
    }

    // Ambil semua pesan dari chat tertentu
    const [messages] = await db.execute(
      `SELECT id, role, content, created_at 
       FROM message 
       WHERE chat_id = ? 
       ORDER BY created_at ASC`,
      [chatId]
    ) as any;

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: "Gagal mengambil pesan" },
      { status: 500 }
    );
  }
}
