import ChannelListHeader from "@/src/components/ChannelListHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { channelListStyles } from "@/src/shared/globalStyles";
import { ChatFilter } from "@/src/shared/typesAndInterfaces";
import { colors } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { StyleSheet, View } from "react-native";
import { ChannelList } from "stream-chat-expo";
import React, { useState } from "react";
import { router } from "expo-router";

export default function MotherChatListScreen() {
  const me = useAuthStore((state) => state.me);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ChatFilter>("all");

  const memoizedFilters = React.useMemo(() => {
    const filters: any = {
      members: { $in: [String(me?.id)] },
      type: "messaging",
      ...(searchQuery && { name: { $autocomplete: searchQuery } }),
    };
    if (filterType === "unread") {
      filters.has_unread = true;
    }
    if (searchQuery) {
      filters.name = { $autocomplete: searchQuery };
    }
    return filters;
  }, [searchQuery, filterType]);

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
            ListHeaderComponent: (
              <ChannelListHeader
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterType={filterType}
                setFilterType={setFilterType}
              />
            ),
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
