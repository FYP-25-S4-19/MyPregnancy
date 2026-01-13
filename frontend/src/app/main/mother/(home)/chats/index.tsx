import ChannelListHeader from "@/src/components/ChannelListHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { StyleSheet, View } from "react-native";
import { ChannelList } from "stream-chat-expo";
import React, { useState } from "react";
import { router } from "expo-router";
import { channelListStyles } from "@/src/shared/globalStyles";

export default function MotherChatListScreen() {
  const me = useAuthStore((state) => state.me);

  const [searchQuery, setSearchQuery] = useState("");
  const filters = {
    members: { $in: [String(me?.id)] },
    type: "messaging",
  };
  const memoizedFilters = React.useMemo(() => filters, []);

  return (
    <View style={styles.container}>
      <SafeAreaView style={channelListStyles.container} edges={["top"]}>
        <ChannelList
          filters={memoizedFilters}
          onSelect={(channel) => {
            router.push(`/main/chat/${channel.cid}`);
          }}
          options={{ state: true, watch: true }}
          sort={{ last_updated: -1 }}
          additionalFlatListProps={{
            ListHeaderComponent: <ChannelListHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />,
          }}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
});
