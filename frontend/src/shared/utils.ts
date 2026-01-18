import { JwtData, MeData } from "./typesAndInterfaces";
import { Channel, UserResponse } from "stream-chat";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { jwtDecode } from "jwt-decode";
import * as Device from "expo-device";
import api from "./api";

const utils = {
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
};

export default utils;
