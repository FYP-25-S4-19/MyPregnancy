import { jwtDecode } from "jwt-decode";
import { JwtData, MeData } from "./typesAndInterfaces";
import { Channel, UserResponse } from "stream-chat";

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
  getOtherMemberFromChannel(channel: Channel, myID: string): UserResponse | undefined {
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
};

export default utils;
