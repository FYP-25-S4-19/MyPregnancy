import { router, useRootNavigationState, useSegments } from "expo-router";
import useAuthStore from "../authStore";
import { useEffect } from "react";

export function useProtectedRoute() {
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore.persist.hasHydrated();
  const me = useAuthStore((state) => state.me);

  useEffect(() => {
    if (!isHydrated) return;
    if (!rootNavigationState?.key) return;

    const navigationReady = rootNavigationState.key != null;
    if (!navigationReady) return;

    if (!segments || segments.length === 0) return;

    // "Logged-out" user trying to access a "non-guest" page
    const withinGuestAllowedRoute = segments[0] === "(intro)" || segments[1] === "guest"; // ---> /main/guest
    if (!accessToken) {
      if (!withinGuestAllowedRoute) {
        router.replace("/(intro)"); // Redirect to intro page
      }
      return; // Within an allowed route - do nothing!
    }

    // "Logged-in" User trying to access "intro" pages
    // Redirect to their home page
    if (segments[0] === "(intro)") {
      const role = me?.role;
      if (role === "PREGNANT_WOMAN") {
        router.replace("/main/mother");
      }
      if (role === "NUTRITIONIST") {
        router.replace("/main/nutritionist");
      }
      if (role === "VOLUNTEER_DOCTOR") {
        router.replace("/main/doctor");
      }
    }

    const timer = setTimeout(() => {}, 0);
    return () => clearTimeout(timer);
  }, [accessToken, segments, isHydrated, me?.role, rootNavigationState?.key]);
}
