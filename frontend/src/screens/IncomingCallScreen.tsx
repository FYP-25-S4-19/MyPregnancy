import { useCallStateHooks, useConnectedUser, useCall, UserResponse } from "@stream-io/video-react-native-sdk";
import { StyleSheet, View, Text, Image, Pressable } from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../shared/designSystem";

const IncomingCall = () => {
  const call = useCall();
  const connectedUser = useConnectedUser();
  const { useCallMembers } = useCallStateHooks();
  const members = useCallMembers();

  const otherMember: UserResponse | undefined = (members || [])
    .map(({ user }) => user)
    .filter((user) => user.id !== connectedUser?.id)[0];

  const onAcceptCall = async () => {
    try {
      await call?.join();
    } catch (e) {
      console.log("Error accepting call:", e);
    }
  };

  const onRejectCall = async () => {
    try {
      const reason = call?.isCreatedByMe ? "cancel" : "decline";
      await call?.leave({ reject: true, reason });
    } catch (e) {
      console.log("Error rejecting call:", e);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.callerInfo}>
          <View style={styles.avatarContainer}>
            {otherMember?.image ? (
              <Image
                source={{
                  uri: otherMember.image,
                }}
                style={styles.avatar}
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={72} />
            )}
          </View>
          <Text style={styles.callerName}>{otherMember?.name || "Dr. John"}</Text>
        </View>

        {/* --- BOTTOM SECTION: Action Buttons --- */}
        <View style={styles.actionsContainer}>
          {/* Accept Button (Green) */}
          <Pressable onPress={onAcceptCall} style={[styles.button, styles.acceptButton]}>
            <Feather name="phone" size={32} color="white" />
          </Pressable>

          {/* Reject Button (Red) */}
          <Pressable onPress={onRejectCall} style={[styles.button, styles.rejectButton]}>
            <Feather name="phone-off" size={32} color="white" />
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between", // Pushes content apart (Top vs Bottom)
    alignItems: "center",
    paddingVertical: 80, // Spacing from top/bottom edges
  },

  // Caller Info Styles
  callerInfo: {
    alignItems: "center",
    marginTop: 40,
  },
  avatarContainer: {
    width: 170,
    height: 170,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: "white",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 24,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  callerName: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },

  // Button Styles
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%", // Horizontal spread of buttons
    marginBottom: 40,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  rejectButton: {
    backgroundColor: colors.fail,
  },
});

export default IncomingCall;
