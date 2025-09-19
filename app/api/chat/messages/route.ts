// app/api/chat/message/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Sesuaikan path dengan lokasi file db Anda

export async function POST(req: Request) {
  try {
    const { chatId, role, content } = await req.json();

    // Validasi input
    if (!chatId || !role || !content) {
      return NextResponse.json(
        { error: "chatId, role, dan content diperlukan" },
        { status: 400 }
      );
    }

    if (!['user', 'ai'].includes(role)) {
      return NextResponse.json(
        { error: "Role harus 'user' atau 'ai'" },
        { status: 400 }
      );
    }

    // Simpan pesan ke database
    const [result] = await db.execute(
      'INSERT INTO message (chat_id, role, content) VALUES (?, ?, ?)',
      [chatId, role, content]
    ) as any;

    return NextResponse.json({ 
      messageId: result.insertId,
      message: "Pesan berhasil disimpan" 
    });
  } catch (error) {
    console.error('Error saving message:', error);
    return NextResponse.json(
      { error: "Gagal menyimpan pesan" },
      { status: 500 }
    );
  }
}