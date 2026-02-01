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
  /**
   * Extract the year from ISO 8601 datetime string for "member since" display
   */
  getMemberSinceYear(createdAt: string): string {
    try {
      const date = new Date(createdAt);
      return date.getFullYear().toString();
    } catch {
      return "";
    }
  },
  /**
   * Will try to decode the JWT and return null if it FAILS or if is EXPIRED
   */
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

    const formattedTime = timeString
      .replace(" ", "") // Remove space before AM/PM
      .toLowerCase();

    return `${dayWithSuffix} ${month} ${formattedTime}`;
  },
  getOtherMemberInChannel(channel: Channel, myID: string): UserResponse | undefined {
    if (!channel) return;

    const otherMembers = Object.values(channel.state.members).filter((member) => member.user_id !== myID);
    if (otherMembers.length < 1) {
      return;
    }

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
  /**
   * Common profile action handlers
   */
  handleChangePassword(): void {
    const authStore = useAuthStore.getState();
    let newPassword = "";

    Alert.prompt(
      "Change Password",
      "Enter your new password",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Next",
          onPress: (password?: string) => {
            if (!password || password.length < 8) {
              Alert.alert("Invalid Password", "Password must be at least 8 characters long");
              return;
            }
            newPassword = password;

            // Second prompt for confirmation
            Alert.prompt(
              "Confirm Password",
              "Re-enter your new password",
              [
                {
                  text: "Cancel",
                  onPress: () => {},
                  style: "cancel",
                },
                {
                  text: "Update",
                  onPress: async (confirm?: string) => {
                    if (confirm !== newPassword) {
                      Alert.alert("Passwords Don't Match", "The passwords you entered do not match");
                      return;
                    }

                    try {
                      const me = authStore.me;
                      if (!me) {
                        Alert.alert("Error", "User data not found");
                        return;
                      }

                      await api.patch("/users/me", {
                        password: newPassword,
                        email: me.email,
                        first_name: me.first_name,
                        middle_name: me.middle_name || null,
                        last_name: me.last_name,
                        role: me.role,
                      });

                      Alert.alert("Success", "Your password has been updated successfully");
                    } catch (error: any) {
                      const errorMsg = error?.response?.data?.detail || error?.message || "Failed to update password";
                      Alert.alert("Update Failed", errorMsg);
                    }
                  },
                },
              ],
              "secure-text",
            );
          },
        },
      ],
      "secure-text",
    );
  },

  handleDeleteAccount(): void {
    const authStore = useAuthStore.getState();

    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => {},
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await api.delete(`/me/delete`);

              authStore.clearAuthState();
              router.replace("/(intro)");

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

  handleSignOut(): void {
    const { clearAuthState } = useAuthStore.getState();
    clearAuthState();
    router.replace("/(intro)/onboarding");
  },

  async handleChangePhoto(): Promise<FormData | null> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need permission to access your media library");
        return null;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      if (!asset.uri) {
        throw new Error("Failed to get image URI");
      }

      // Create FormData
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
