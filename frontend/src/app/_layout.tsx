import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StreamClientProvider } from "../shared/streamClientProvider";
import { useProtectedRoute } from "../shared/hooks/useProtectedRoute";
import { Slot } from "expo-router";
import "react-native-reanimated";

const queryClient = new QueryClient();

export default function RootLayout() {
  useProtectedRoute();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StreamClientProvider>
          <Slot />
        </StreamClientProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
