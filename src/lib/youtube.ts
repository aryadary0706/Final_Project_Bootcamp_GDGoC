// utils/youtube.ts
export async function searchYouTube(query: string) {
  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(query)}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch from YouTube API");
  }

  const data = await res.json();
  return data.items.map((item: any) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails.medium.url,
  }));
}
