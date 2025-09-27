"use client";
import { useEffect, useRef, useState } from "react";
import { useCalendarStore } from "../app/store/calendarStore";

declare global {
  interface Window {
    google: any;
  }
}

export function useGoogleCalendarToken() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [expiryTime, setExpiryTime] = useState<number | null>(null); // ⬅️ tambahan
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokenClientRef = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setAccessToken: setGlobalToken } = useCalendarStore();

  // Load token + expiry dari localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("google_access_token");
    const storedExpiry = localStorage.getItem("google_token_expiry");

    console.log("Reading from localStorage on mount:", {
    token: storedToken,
    expiry: storedExpiry
    });

    if (storedToken) {
      console.log("Loaded access token from localStorage:", storedToken);
      setAccessToken(storedToken);
      setGlobalToken(storedToken);
    }
    if (storedExpiry) {
      setExpiryTime(parseInt(storedExpiry, 10));
    }
  }, []);

  useEffect(() => {
    const initializeGoogleAPI = () => {
      if (!window.google) {
        console.warn("Google API belum dimuat di window.google");
        setTimeout(initializeGoogleAPI, 1000);
        return;
      }

      console.log("Initializing Google OAuth token client");
      setIsLoading(false);

      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        scope: "https://www.googleapis.com/auth/calendar.events",
        prompt: "",
        callback: (res: any) => {
          setIsConnecting(false);
          console.log("OAuth callback received:", res);
          if (res.error) {
            setError(res.error);
            console.error("OAuth error:", res.error);
            alert("OAuth Error: " + res.error);
          } else {
            console.log("Access token received:", res.access_token);
            setAccessToken(res.access_token);
            setGlobalToken(res.access_token);

            // simpan expiry time
            const expiresIn = res.expires_in ? Date.now() + res.expires_in * 1000 : null;
            setExpiryTime(expiresIn);
            if (expiresIn) {
              localStorage.setItem("google_token_expiry", expiresIn.toString());
            }

            setError(null);
            localStorage.setItem("google_access_token", res.access_token);
            alert("✅ Google Calendar connected successfully!");
            window.open("https://calendar.google.com", "_blank");
          }
        },
      });
    };

    initializeGoogleAPI();
  }, []);

  // Simpan token ke localStorage ketika berubah
  useEffect(() => {
    if (accessToken) {
      console.log("Saving access token to localStorage:", accessToken);
      localStorage.setItem("google_access_token", accessToken);
    } else {
      console.log("Removing access token from localStorage");
      localStorage.removeItem("google_access_token");
    }
  }, [accessToken]);

  // Auto-refresh token sebelum expire
  useEffect(() => {
    if (!expiryTime || !tokenClientRef.current) return;

    const now = Date.now();
    const refreshTime = expiryTime - 60 * 1000; // refresh 1 menit sebelum expired

    if (refreshTime > now) {
      const timeout = setTimeout(() => {
        console.log("Refreshing Google access token...");
        tokenClientRef.current.requestAccessToken({ prompt: "" });
      }, refreshTime - now);

      return () => clearTimeout(timeout);
    }
  }, [expiryTime, tokenClientRef]);

  // fungsi dipanggil tombol
  const requestAccess = () => {
    tokenClientRef.current.requestAccessToken({ prompt: "" });
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
    setIsConnecting(true);
    tokenClientRef.current.requestAccessToken({ prompt: "" });
  };

  return { accessToken, error, connect: requestAccess, isLoading, isConnecting };
}
