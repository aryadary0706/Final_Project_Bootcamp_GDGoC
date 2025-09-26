import { db } from "./db";
import { EmbedContentRequest, GoogleGenerativeAI, Part } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Ambil semua pesan dari DB
export async function getAllMessages() {
  const [rows]: any = await db.query("SELECT id, content FROM message");
  return rows.map((r: any) => ({ id: r.id, content: r.content }));
}

// ===== Embedding Store (sederhana, in-memory) =====
let vectorStore: { id: number; content: string; embedding: number[] }[] = [];

export async function buildVectorStore() {
  const messages = await getAllMessages();

  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });

  const embeddings = await Promise.all(
    messages.map(async (msg: { content: string | (string | Part)[] | EmbedContentRequest; id: any; }) => {
      const result = await embeddingModel.embedContent(msg.content);
      return {
        id: msg.id,
        content: msg.content,
        embedding: result.embedding.values,
      };
    })
  );

  vectorStore = embeddings;
  return vectorStore;
}

// ===== Cosine Similarity =====
function cosineSim(a: number[], b: number[]) {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

// ===== Retrieval =====
export async function retrieveRelevantDocs(query: string, k = 3) {
  if (vectorStore.length === 0) {
    await buildVectorStore();
  }

  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embeddingModel.embedContent(query);
  const queryEmb = result.embedding.values;

  return vectorStore
    .map((doc) => ({
      ...doc,
      score: cosineSim(queryEmb, doc.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export async function retrieveDocs(query: string, k = 3) {
  const embeddingModel = genAI.getGenerativeModel({ model: "embedding-001" });
  const result = await embeddingModel.embedContent(query);
  const queryEmb = result.embedding.values;

  const [rows]: any = await db.query("SELECT * FROM documents");
  const docs = rows.map((r: any) => ({
    id: r.id,
    content: r.content,
    embedding: JSON.parse(r.embedding),
  }));

  function cosineSim(a: number[], b: number[]) {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
  }

  return docs
    .map((doc: { embedding: number[]; }) => ({
      ...doc,
      score: cosineSim(queryEmb, doc.embedding),
    }))
    .sort((a: { score: number; }, b: { score: number; }) => b.score - a.score)
    .slice(0, k);
}

