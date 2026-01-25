import axios, { HttpStatusCode } from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Device from "expo-device";
import axiosRetry, { linearDelay } from "axios-retry";
import useAuthStore from "./authStore";

if (process.env.EXPO_PUBLIC_APP_ENV !== "dev" && process.env.EXPO_PUBLIC_APP_ENV !== "prod") {
  throw new Error("EXPO_PUBLIC_APP_ENV should be set to either 'dev' or 'prod' explicitly");
}

export const getDevHostIp = (): string => {
  // Emulator check
  const isEmulator = !Device.isDevice;
  if (isEmulator) {
    if (Platform.OS === "android") {
      return "10.0.2.2";
    }
    return "localhost"; // iOS Simulator uses standard localhost
  }

  // Physical Device Check (LAN IP)
  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhostIp = debuggerHost?.split(":")[0];
  if (localhostIp) {
    return localhostIp;
  }

  return "localhost"; // Fallback to localhost
};

const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_APP_ENV === "prod") {
    return "https://api.my-pregnancy.click/";
  }

  const host: string = getDevHostIp();
  return `http://${host}:8000/`;
};

const api = axios.create({ baseURL: getBaseUrl(), timeout: 10000 });
axiosRetry(api, { retryDelay: linearDelay(), retries: 3 });

// Recursively walks through the JSON response to find and fix S3 URLs
const replaceS3Localhost = (data: any, hostIp: string): any => {
  // Handle Strings (The actual fix)
  if (typeof data === "string") {
    // All the pre-signed URLs from S3 start with this as the prefix
    if (data.includes("http://localstack:4566")) {
      return data.replace("http://localstack:4566", `http://${hostIp}:4567`);
    }
    return data;
  }

  // Handle Arrays (Recursion)
  if (Array.isArray(data)) {
    return data.map((item) => replaceS3Localhost(item, hostIp));
  }

  // Handle Objects (Recursion)
  if (typeof data === "object" && data !== null) {
    const newData: any = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        newData[key] = replaceS3Localhost(data[key], hostIp);
      }
    }
    return newData;
  }

  return data; // Return primitives as is
};

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (process.env.EXPO_PUBLIC_APP_ENV === "dev" && response.data) {
      const hostIp: string = getDevHostIp();
      // Only run the recursive replace if the host isn't already 'localhost'
      if (hostIp !== "localhost") {
        response.data = replaceS3Localhost(response.data, hostIp);
      }
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === HttpStatusCode.Unauthorized) {
      console.log("Authentication error: Token expired or invalid.");
      useAuthStore.getState().clearAuthState();
    }
    return Promise.reject(error);
  },
);

export default api;
