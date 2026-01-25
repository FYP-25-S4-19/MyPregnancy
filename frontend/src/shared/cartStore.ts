import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";

export type CartItem = {
  key: string;
  productId: number;
  name: string;
  priceCents: number;
  imgUrl: string | null;
  color?: string;
  quantity: number;
};

type AddToCartInput = {
  productId: number;
  name: string;
  priceCents: number;
  imgUrl: string | null;
  color?: string;
  quantity?: number;
};

interface CartState {
  items: Record<string, CartItem>;

  addItem: (input: AddToCartInput) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  clearCart: () => void;

  getTotalItems: () => number;
  getSubtotalCents: () => number;
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

const makeKey = (productId: number, color?: string) => `${productId}:${(color ?? "").trim().toLowerCase()}`;

const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},

      addItem: (input) => {
        const key = makeKey(input.productId, input.color);
        const qtyToAdd = Math.max(1, input.quantity ?? 1);

        set((state) => {
          const existing = state.items[key];
          const nextQty = (existing?.quantity ?? 0) + qtyToAdd;

          return {
            items: {
              ...state.items,
              [key]: {
                key,
                productId: input.productId,
                name: input.name,
                priceCents: input.priceCents,
                imgUrl: input.imgUrl,
                color: input.color,
                quantity: nextQty,
              },
            },
          };
        });
      },

      removeItem: (key) => {
        set((state) => {
          const next = { ...state.items };
          delete next[key];
          return { items: next };
        });
      },

      setQuantity: (key, quantity) => {
        const nextQty = Math.max(0, Math.floor(quantity));
        set((state) => {
          if (nextQty <= 0) {
            const next = { ...state.items };
            delete next[key];
            return { items: next };
          }
          const existing = state.items[key];
          if (!existing) return state;
          return {
            items: {
              ...state.items,
              [key]: { ...existing, quantity: nextQty },
            },
          };
        });
      },

      increment: (key) => {
        const existing = get().items[key];
        if (!existing) return;
        get().setQuantity(key, existing.quantity + 1);
      },

      decrement: (key) => {
        const existing = get().items[key];
        if (!existing) return;
        get().setQuantity(key, existing.quantity - 1);
      },

      clearCart: () => set({ items: {} }),

      getTotalItems: () => Object.values(get().items).reduce((sum, item) => sum + item.quantity, 0),

      getSubtotalCents: () =>
        Object.values(get().items).reduce((sum, item) => sum + item.priceCents * item.quantity, 0),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => expoSecureStore),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

export default useCartStore;
