import { TextInput } from "react-native-gesture-handler";
import { StyleSheet, Text, View } from "react-native";
import { FC } from "react";
import { colors, font, sizes } from "../shared/designSystem";
import { Ionicons } from "@expo/vector-icons";

interface ChannelListSearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ChannelListSearchBar: FC<ChannelListSearchBarProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <View style={clSearchBarStyles.container}>
      <TextInput placeholder="Search" value={searchQuery} onChangeText={setSearchQuery} />
      <Ionicons name="search" size={20} style={{ color: "#b7b7b7" }} />
    </View>
  );
};

const clSearchBarStyles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    height: 40,
    paddingHorizontal: sizes.l,
    marginBottom: sizes.m,

    borderRadius: sizes.borderRadius * 3,
    backgroundColor: colors.secondary,
  },
});
//==============================================================
interface ChannelFilterPillProps {
  text: string;
}

const ChannelFilterPill: FC<ChannelFilterPillProps> = ({ text }) => {
  return (
    <View style={clPillStyles.container}>
      <Text style={clPillStyles.pillText}>{text}</Text>
    </View>
  );
};

const clPillStyles = StyleSheet.create({
  container: {
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    backgroundColor: colors.secondary,
    borderRadius: sizes.borderRadius * 5,
  },
  pillText: {},
});
//==============================================================
interface ChannelListProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ChannelListHeader: FC<ChannelListProps> = ({ searchQuery, setSearchQuery }) => {
  return (
    <View style={clStyles.container}>
      <Text style={clStyles.headerText}>Chats</Text>
      <ChannelListSearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <View style={clStyles.pillContainer}>
        <ChannelFilterPill text="All" />
        <ChannelFilterPill text="Unread" />
      </View>
    </View>
  );
};

const clStyles = StyleSheet.create({
  container: {
    // padding: sizes.m,
  },
  headerText: {
    fontSize: font.xl,
    fontWeight: "bold",
    color: colors.text,

    marginLeft: sizes.s,
    marginVertical: sizes.m,
  },
  pillContainer: {
    flex: 1,
    flexDirection: "row",
    gap: sizes.s,
    marginBottom: sizes.m,
  },
});

export default ChannelListHeader;
