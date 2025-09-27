import { google } from "googleapis";
import { NextResponse } from "next/server";

// googleapis butuh Node.js runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { access_token, summary, description, start, end, timezone } = body;

    if (!access_token) {
      return NextResponse.json({ success: false, error: "Missing access_token" }, { status: 400 });
    }

    // OAuth2 client hanya pakai access_token yang sudah didapat di client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: summary || "Belajar Bareng AI 🤖",
      description: description || "Event dari StudyBuddy Chatbot",
      start: {
        dateTime: start,
        timeZone: timezone || "Asia/Jakarta",
      },
      end: {
        dateTime: end,
        timeZone: timezone || "Asia/Jakarta",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    console.error("Google Calendar error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}