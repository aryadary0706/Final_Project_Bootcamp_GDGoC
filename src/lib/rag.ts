import { db } from "./db";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// cosine similarity
function cosineSim(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

export async function retrieveRelevantDocs(query: string, k = 3) {
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embeddingModel.embedContent(query);
  const queryEmb = result.embedding.values;

  // ambil semua dokumen
  const [rows]: any = await db.query("SELECT id, content, embedding FROM documents");

  // hitung similarity
  return rows
    .map((row: any) => ({
      id: row.id,
      content: row.content,
      score: cosineSim(queryEmb, JSON.parse(row.embedding)),
    }))
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, k);
}
