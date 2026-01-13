import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { FC } from "react";
import { colors, font, shadows, sizes } from "@/src/shared/designSystem";

interface ShopForYouAndBabyProps {
  onBackPress: () => void;
}

export const ShopForYouAndBaby: FC<ShopForYouAndBabyProps> = ({ onBackPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.txt}>{"Shop for You & Baby"}</Text>
      <TouchableOpacity style={styles.btn} onPress={onBackPress}>
        <Text style={styles.btnText}>{"Shop Now"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: colors.white,
    borderRadius: sizes.m,
    paddingVertical: sizes.m,
    paddingHorizontal: sizes.l,
    marginHorizontal: sizes.m,
    marginBottom: sizes.m,
    ...shadows.small,
  },
  txt: {
    fontSize: font.m,
    fontWeight: "700",
    color: colors.text,
  },
  btn: {
    paddingHorizontal: sizes.s,
    paddingVertical: sizes.s,
    borderRadius: sizes.borderRadius * 0.5,
    outlineWidth: 1,
    outlineColor: colors.lightGray,
  },
  btnText: {
    fontSize: font.xxs,
    color: colors.text,
  },
});
