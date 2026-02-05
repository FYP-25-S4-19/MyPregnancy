import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import { MeData } from "./typesAndInterfaces";
import { create } from "zustand";

interface AuthState {
  me: MeData | null;
  accessToken: string | null;

  // ✅ add this
  isSigningOut: boolean;
  setIsSigningOut: (v: boolean) => void;

  setMe: (me: MeData | null) => void;
  setAccessToken: (token: string | null) => void;

  clearAuthState: () => void;
}

const expoSecureStore: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      me: null,
      accessToken: null,

      // ✅ new
      isSigningOut: false,
      setIsSigningOut: (v) => set({ isSigningOut: v }),

      setMe: (me) => set({ me }),
      setAccessToken: (token) => set({ accessToken: token }),

      clearAuthState: () => set({ me: null, accessToken: null }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => expoSecureStore),
    },
  ),
);

export default useAuthStore;