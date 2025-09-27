import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth"; // untuk docx

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ekstrak teks dari berbagai file
async function extractText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (file.name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  } else if (file.name.endsWith(".pdf")) {
    const data = await pdfParse(buffer);
    return data.text;
  } else if (file.name.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else {
    throw new Error("Unsupported file type");
  }
}

// pecah teks jadi chunk agar lebih efisien
function chunkText(text: string, chunkSize = 500): string[] {
  const words = text.split(" ");
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. extract text
    const text = await extractText(file);

    // 2. chunking
    const chunks = chunkText(text);

    // 3. generate embeddings untuk tiap chunk
    const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

    for (const chunk of chunks) {
      const emb = await embeddingModel.embedContent(chunk);

      await db.query(
        "INSERT INTO documents (filename, content, embedding) VALUES (?, ?, ?)",
        [file.name, chunk, JSON.stringify(emb.embedding.values)]
      );
    }

    return NextResponse.json({ success: true, filename: file.name, chunks: chunks.length });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
