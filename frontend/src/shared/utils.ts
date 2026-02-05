import { JwtData, MeData } from "./typesAndInterfaces";
import { Channel, UserResponse } from "stream-chat";
import * as Notifications from "expo-notifications";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import { jwtDecode } from "jwt-decode";
import * as Device from "expo-device";
import * as ImagePicker from "expo-image-picker";
import useAuthStore from "./authStore";
import { router } from "expo-router";
import api from "./api";

const utils = {
  getMemberSinceYear(createdAt: string): string {
    try {
      const date = new Date(createdAt);
      return date.getFullYear().toString();
    } catch {
      return "";
    }
  },

  safeDecodeUnexpiredJWT(jwt: string): JwtData | null {
    try {
      const jwtData = jwtDecode<JwtData>(jwt);
      return jwtData.exp < Math.floor(Date.now() / 1000) ? null : jwtData;
    } catch {
      return null;
    }
  },

  formatFullname(me: MeData): string {
    return [me.first_name, me.middle_name, me.last_name]
      .filter((namePart) => namePart && namePart.trim().length > 0)
      .join(" ");
  },

  formatConsultRequestDate(date: Date): string {
    const day = date.getDate();
    let dayWithSuffix: string;

    if (day > 3 && day < 21) {
      dayWithSuffix = `${day}th`;
    } else {
      switch (day % 10) {
        case 1:
          dayWithSuffix = `${day}st`;
          break;
        case 2:
          dayWithSuffix = `${day}nd`;
          break;
        case 3:
          dayWithSuffix = `${day}rd`;
          break;
        default:
          dayWithSuffix = `${day}th`;
          break;
      }
    }
    const month = date.toLocaleDateString("en-US", { month: "long" });
    const timeString = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const formattedTime = timeString.replace(" ", "").toLowerCase();
    return `${dayWithSuffix} ${month} ${formattedTime}`;
  },

  getOtherMemberInChannel(channel: Channel, myID: string): UserResponse | undefined {
    if (!channel) return;

    const otherMembers = Object.values(channel.state.members).filter((member) => member.user_id !== myID);
    if (otherMembers.length < 1) return;
    return otherMembers[0].user;
  },

  capitalizeFirstLetter(str: string): string {
    if (str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  firstLetterOfEveryWordCapitalized(str: string): string {
    return str
      .split(" ")
      .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() : ""))
      .join("");
  },

  centsToDollarStr(cents: number): string {
    const dollars = cents / 100;
    return `${dollars.toFixed(2)}`;
  },

  _alertAndThrowErrorMessage(errorMessage: string): void {
    alert(errorMessage);
    throw new Error(errorMessage);
  },

  async registerForPushNofificationsAsync(userID: string): Promise<string | undefined> {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        this._alertAndThrowErrorMessage("Permission not granted to get push token for push notification!");
        return;
      }
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        this._alertAndThrowErrorMessage("Project ID not found");
      }
      try {
        const pushTokenString = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await api.patch("/notifications/upsert", { token: pushTokenString });
        return pushTokenString;
      } catch (e: unknown) {
        this._alertAndThrowErrorMessage(`${e}`);
      }
    } else {
      this._alertAndThrowErrorMessage("Must use physical device for push notifications");
    }
  },

  handleDeleteAccount(): void {
    const authStore = useAuthStore.getState();

    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await api.delete(`/me/delete`);
              authStore.clearAuthState();
              router.replace("/(intro)" as any); // ✅ keep consistent
              Alert.alert("Account Deleted", "Your account has been permanently deleted");
            } catch (error: any) {
              const errorMsg = error?.response?.data?.detail || error?.message || "Failed to delete account";
              Alert.alert("Deletion Failed", errorMsg);
            }
          },
          style: "destructive",
        },
      ],
    );
  },

  // ✅ FIXED LOGOUT REDIRECT
  handleSignOut(): void {
    const store = useAuthStore.getState();

    // 1) Mark logout in progress so useProtectedRoute won't bounce to /main/guest
    store.setIsSigningOut(true);

    // 2) Navigate FIRST to your intended “main home page”
    //    This should be the nice carousel screen you showed.
    router.replace("/(intro)" as any);

    // 3) Clear auth AFTER the navigation request (next tick)
    setTimeout(() => {
      store.clearAuthState();
      store.setIsSigningOut(false);
    }, 0);
  },

  async handleChangePhoto(): Promise<FormData | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need permission to access your media library");
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) return null;

      const asset = result.assets[0];
      if (!asset.uri) throw new Error("Failed to get image URI");

      const formData = new FormData();
      formData.append("profile_img", {
        uri: asset.uri,
        type: "image/jpeg",
        name: "profile.jpg",
      } as any);

      return formData;
    } catch (error: any) {
      console.error("Image picker error:", error);
      throw error;
    }
  },
};

export default utils;
