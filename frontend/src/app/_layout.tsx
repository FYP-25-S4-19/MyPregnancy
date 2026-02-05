import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StreamClientProvider } from "../shared/streamClientProvider";
import { useProtectedRoute } from "../shared/hooks/useProtectedRoute";
import { Slot } from "expo-router";
import "react-native-reanimated";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary";
import GuestGateModal from "@/src/components/modals/GuestGateModal";

const queryClient = new QueryClient();

export default function RootLayout() {
  useProtectedRoute();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <StreamClientProvider>
            <Slot />
            {/* ✅ Always mounted so openGuestGate() can show it from anywhere */}
            <GuestGateModal />
          </StreamClientProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}