import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth"; 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else if (file.name.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (file.name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  } else {
    throw new Error("Unsupported file type. Hanya mendukung .txt, .pdf, .docx");
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await extractText(file);

    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
    const emb = await embeddingModel.embedContent(text);

    await db.query(
      "INSERT INTO documents (filename, content, embedding) VALUES (?, ?, ?)",
      [file.name, text, JSON.stringify(emb.embedding.values)]
    );

    return NextResponse.json({ success: true, filename: file.name });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
