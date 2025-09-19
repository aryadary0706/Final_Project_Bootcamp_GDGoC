"use client";
import { useEffect } from "react";
import { useGoogleCalendarToken } from "@/lib/useGoogleCalendarToken";
import { createCalendarEvent } from "@/lib/createCalendarEvent";

export default function CalendarConnectButton() {
  const { accessToken, connect, error, isLoading } = useGoogleCalendarToken();

  // Debug accessToken in button component
  useEffect(() => {
    console.log("Access token in CalendarConnectButton:", accessToken);
  }, [accessToken]);

  const handleConnect = () => {
    console.log("Connect button clicked");
    console.log("Google API available:", !!window.google);
    console.log("Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

    if (!window.google) {
      alert("Google API not loaded yet. Please wait a moment and try again.");
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      alert("Google Client ID not configured. Please check your environment variables.");
      return;
    }

    connect();
  };

  const testCalendarEvent = async () => {
    if (!accessToken) {
      alert("Please connect to Google Calendar first!");
      return;
    }

    try {
      const res = await createCalendarEvent(accessToken, {
        title: "Test Event - StudyBuddy Integration",
        description: "Testing Google Calendar integration with StudyBuddy",
        start: new Date(Date.now() + 60000).toISOString(), // 1 minute from now
        end: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        timezone: "Asia/Jakarta",
      });

      if (res.success) {
        alert("✅ Test event created successfully! Check your Google Calendar.");
      } else {
        alert("❌ Failed to create test event: " + res.error);
      }
    } catch (error) {
      alert("❌ Error creating test event: " + (error as Error).message);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleConnect}
        disabled={isLoading}
        className={`px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
          accessToken
            ? "bg-green-500 hover:bg-green-600"
            : isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : accessToken ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Connected
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1-1 1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            Connect Calendar
          </span>
        )}
      </button>

      {accessToken && (
        <button
          onClick={testCalendarEvent}
          className="px-3 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium transition-colors"
        >
          Test Event
        </button>
      )}

      {accessToken && (
        <div className="text-xs text-green-600 font-medium">
          ✓ Ready to create events
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600 font-medium">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
