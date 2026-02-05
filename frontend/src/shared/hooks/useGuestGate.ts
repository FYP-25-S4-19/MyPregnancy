import { create } from "zustand";

type GuestGateState = {
  isOpen: boolean;
  attemptedPath: string | null;

  // NEW: used to prevent opening gate once (e.g. during logout redirect)
  suppressOnce: boolean;

  open: (attemptedPath: string) => void;
  close: () => void;
  reset: () => void;

  // NEW
  suppressNextOpen: () => void;
  consumeSuppressOnce: () => boolean;
};

export const useGuestGate = create<GuestGateState>((set, get) => ({
  isOpen: false,
  attemptedPath: null,
  suppressOnce: false,

  open: (attemptedPath) => {
    // If suppressed, don't open modal (and consume suppression)
    if (get().suppressOnce) {
      set({ suppressOnce: false, isOpen: false, attemptedPath: null });
      return;
    }
    set({ isOpen: true, attemptedPath });
  },

  close: () => set({ isOpen: false }),

  reset: () => set({ isOpen: false, attemptedPath: null, suppressOnce: false }),

  suppressNextOpen: () => set({ suppressOnce: true }),

  consumeSuppressOnce: () => {
    const { suppressOnce } = get();
    if (suppressOnce) set({ suppressOnce: false });
    return suppressOnce;
  },
}));