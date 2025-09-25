// src/lib/youtube.ts

export async function searchYouTube(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY; // ✅ Gunakan env server, BUKAN NEXT_PUBLIC_

  // Jika tidak ada API key, kembalikan array kosong (jangan throw error yang crash backend)
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY tidak ditemukan di environment variables");
    return [];
  }

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
        query
      )}&key=${apiKey}&type=video&maxResults=2`
    );

    if (!res.ok) {
      console.error("YouTube API error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();

    // Pastikan data.items ada dan berupa array
    if (!Array.isArray(data?.items)) {
      return [];
    }

    // Filter hanya item yang memiliki videoId yang valid
    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet?.title || "Tanpa Judul",
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
  } catch (error) {
    console.error("Error saat mencari video YouTube:", error);
    return [];
  }
}