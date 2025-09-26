import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { retrieveDocs } from "@/src/lib/rag";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    const docs = await retrieveDocs(query);
    const context = docs.map((d: { content: any; }) => d.content).join("\n");

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(
      `Pertanyaan: ${query}\n\nGunakan konteks berikut jika relevan:\n${context}`
    );

    return NextResponse.json({
      answer: result.response.text(),
      context: docs,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
