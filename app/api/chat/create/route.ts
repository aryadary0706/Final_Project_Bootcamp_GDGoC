// app/api/chat/create/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // Sesuaikan path dengan lokasi file db Anda

export async function POST(req: Request) {
  try {
    const { title } = await req.json();

    // Buat chat baru
    const [result] = await db.execute(
      'INSERT INTO chat (title) VALUES (?)',
      [title || 'Chat Baru']
    ) as any;

    const chatId = result.insertId;

    return NextResponse.json({ 
      chatId,
      message: "Chat berhasil dibuat" 
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json(
      { error: "Gagal membuat chat baru" },
      { status: 500 }
    );
  }
}