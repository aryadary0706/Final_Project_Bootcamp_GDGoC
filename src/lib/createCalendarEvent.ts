// src/lib/createCalendarEvent.ts
export type EventInput = {
  summary: string;
  description?: string;
  start: string;
  end: string;
  timezone?: string;
};

export async function createCalendarEvent(accessToken: string, event: EventInput) {
  try {
    const siteUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const Url = `${siteUrl}/api/chat/calendar`;

    const res = await fetch(Url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken, ...event }),
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.message || "Failed to create calendar event",
      };
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Network error",
    };
  }
}