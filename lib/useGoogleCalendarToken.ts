"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google: any;
  }
}

export function useGoogleCalendarToken() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenClientRef = useRef<any>(null);

  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
      console.log("Loaded access token from localStorage:", storedToken);
      setAccessToken(storedToken);
    }
  }, []);

  useEffect(() => {
    const initializeGoogleAPI = () => {
      if (!window.google) {
        console.warn("Google API belum dimuat di window.google");
        // Retry after a short delay
        setTimeout(initializeGoogleAPI, 1000);
        return;
      }

      console.log("Initializing Google OAuth token client");
      setIsLoading(false);

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: "https://www.googleapis.com/auth/calendar.events",
        prompt: "", // Changed from "consent" to "" to avoid repeated consent prompts
        callback: (res: any) => {
          console.log("OAuth callback received:", res);
          if (res.error) {
            setError(res.error);
            console.error("OAuth error:", res.error);
            alert("OAuth Error: " + res.error);
          } else {
            console.log("Access token received:", res.access_token);
            setAccessToken(res.access_token);
            setError(null);
            // Store token in localStorage
            localStorage.setItem('google_access_token', res.access_token);
            alert("✅ Google Calendar connected successfully!");
            // Open Google Calendar after successful connection
            window.open("https://calendar.google.com", "_blank");
          }
        },
      });
    };

    initializeGoogleAPI();
  }, []);

  // Save token to localStorage whenever it changes
  useEffect(() => {
    if (accessToken) {
      console.log("Saving access token to localStorage:", accessToken);
      localStorage.setItem('google_access_token', accessToken);
    } else {
      console.log("Removing access token from localStorage");
      localStorage.removeItem('google_access_token');
    }
  }, [accessToken]);

  // ini fungsi yang dipanggil tombol
  const requestAccess = () => {
    console.log("Requesting access token...");
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError("Google Client ID not configured");
      return;
    }
    if (!tokenClientRef.current) {
      setError("Token client not initialized");
      console.error("Token client not initialized");
      alert("Token client not initialized. Please try again later.");
      return;
    }
    tokenClientRef.current.requestAccessToken({ prompt: "" });
  };

  return { accessToken, error, connect: requestAccess, isLoading };
}
