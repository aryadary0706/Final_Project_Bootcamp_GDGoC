// store/calendarStore.ts
import { create } from "zustand";

interface CalendarState {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set) => ({
  accessToken: null,
  setAccessToken: (token) => set({ accessToken: token }),
}));