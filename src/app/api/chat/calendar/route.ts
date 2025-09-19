import { google } from "googleapis";
import { NextResponse } from "next/server";

// googleapis butuh Node.js runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { access_token, title, description, start, end, timezone } = body;

    if (!access_token) {
      return NextResponse.json({ success: false, error: "Missing access_token" }, { status: 400 });
    }

    // OAuth2 client hanya pakai access_token yang sudah didapat di client
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token });

    const calendar = google.calendar({ version: "v3", auth });

    const event = {
      summary: title || "Belajar Bareng AI 🤖",
      description: description || "Event dari StudyBuddy Chatbot",
      start: {
        dateTime: start,               // contoh: "2025-09-04T10:00:00+07:00"
        timeZone: timezone || "Asia/Jakarta",
      },
      end: {
        dateTime: end,                 // contoh: "2025-09-04T11:00:00+07:00"
        timeZone: timezone || "Asia/Jakarta",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return NextResponse.json({ success: true, data: response.data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
