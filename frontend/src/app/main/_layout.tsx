//import { CallListener } from "@/src/components/CallListener";
import useAuthStore from "@/src/shared/authStore";
import { Stack } from "expo-router";

export default function MainLayout() {
  //const me = useAuthStore((state) => state.me);

  return (
    <>
      {/* Only mount the listener if we are a logged-in user (not a guest) */}
      {/*{me && <CallListener />}*/}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
