// src/lib/createCalendarEvent.ts

export type EventInput = {
  title: string;
  description?: string;
  start: string; // ISO format, contoh: "2025-09-05T10:00:00+07:00"
  end: string;   // ISO format
  timezone?: string;
};

export async function createCalendarEvent(accessToken: string, event: EventInput) {
  const res = await fetch("/api/chat/calendar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: accessToken, ...event }),
  });

  if (!res.ok) {
    throw new Error("Failed to create calendar event");
  }

  return res.json();
}
