import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { StyleSheet, View } from "react-native";
import { ChannelList } from "stream-chat-expo";
import { router } from "expo-router";
import React from "react";

export default function DoctorChatListScreen() {
  const me = useAuthStore((state) => state.me);
  const filters = {
    members: { $in: [String(me?.id)] },
    type: "messaging",
  };
  const memoizedFilters = React.useMemo(() => filters, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ChannelList
          filters={memoizedFilters}
          onSelect={(channel) => {
            router.push(`/main/doctor/chat/${channel.cid}`);
          }}
          options={{ state: true, watch: true }}
          sort={{ last_updated: -1 }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
