import { create } from "zustand";

type GuestGateState = {
  isOpen: boolean;
  attemptedPath: string | null;

  open: (attemptedPath: string) => void;
  close: () => void;
  reset: () => void;
};

export const useGuestGate = create<GuestGateState>((set) => ({
  isOpen: false,
  attemptedPath: null,

  open: (attemptedPath) => set({ isOpen: true, attemptedPath }),
  close: () => set({ isOpen: false }),
  reset: () => set({ isOpen: false, attemptedPath: null }),
}));