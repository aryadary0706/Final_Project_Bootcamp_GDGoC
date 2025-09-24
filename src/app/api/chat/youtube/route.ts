import { NextResponse } from "next/server";
import { searchYouTube } from "@/src/lib/youtube";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query diperlukan" }, { status: 400 });
    }

    const videos = await searchYouTube(query);

    return NextResponse.json({
      type: "youtube",
      data: videos, // array of {videoId, title, thumbnail}
    });
  } catch (error) {
    console.error("Error searching YouTube:", error);
    return NextResponse.json(
      { error: "Gagal mencari video YouTube" },
      { status: 500 }
    );
  }
}
