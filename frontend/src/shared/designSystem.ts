import { Dimensions } from "react-native";
const { width, height } = Dimensions.get("window");

export const colors = {
  primary: "#FF9B9B", // Pink
  secondary: "#FFCCCC", // Light Pink
  text: "#732727", // Very dark red
  tabIcon: "#A2A2A2",
  inputFieldBackground: "#EEEEEE",

  success: "#34A853",
  warning: "#FBBC05",
  fail: "#FF0000",

  white: "#FFFFFF",
  black: "#000000",
  lightGray: "#D3D3D3",
  veryLightPink: "#FFE0E0",
  orange: "#f3a20a",
};

const SPACING_UNIT = 8;
export const sizes = {
  xs: SPACING_UNIT * 0.5,
  s: SPACING_UNIT * 1,
  m: SPACING_UNIT * 2,
  l: SPACING_UNIT * 3,
  xl: SPACING_UNIT * 4,
  xxl: SPACING_UNIT * 6,

  borderRadius: 8,

  icon: 24,
  screenWidth: width,
  screenHeight: height,
};

export const font = {
  xxl: 34,
  xl: 28,
  l: 24,
  m: 20,
  s: 16,
  xs: 14,
  xxs: 12,
};

export const shadows = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
};

export default {
  colors,
  sizes,
  font,
  shadows,
};
