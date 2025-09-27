import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveRelevantDocs } from "@/src/lib/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();
    if (!query) return NextResponse.json({ error: "No query" }, { status: 400 });

    // 1. Ambil dokumen relevan
    const docs = await retrieveRelevantDocs(query, 3);

    // 2. Buat prompt dengan konteks
    const context = docs.map((d: { content: any; }) => d.content).join("\n---\n");
    const prompt = `Gunakan informasi berikut untuk menjawab pertanyaan.\n\nKonteks:\n${context}\n\nPertanyaan: ${query}`;

    // 3. Kirim ke Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);

    return NextResponse.json({
      answer: result.response.text(),
      sources: docs,
    });
  } catch (e: any) {
    console.error("RAG error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
