import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";

export const AddProductSection: FC = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button}>
        <Ionicons name="add" size={24} color={colors.text} />
        <Text style={styles.buttonText}>Add New Product</Text>
      </TouchableOpacity>

      <View style={styles.draftContainer}>
        <TouchableOpacity style={styles.draftBadge}>
          <Text style={styles.draftText}>Draft</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    gap: sizes.s,

    paddingHorizontal: sizes.m,
    marginTop: sizes.m,
    marginBottom: sizes.l,
  },
  button: {
    backgroundColor: colors.white,
    paddingVertical: sizes.s,
    borderRadius: sizes.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingLeft: sizes.m,
    borderWidth: 1,
    borderColor: colors.secondary,
    ...shadows.small,
  },
  buttonText: {
    color: colors.text,
    fontSize: font.m,
    fontWeight: "600",
    marginLeft: sizes.xs,
  },
  draftContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  draftBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: sizes.m,
    paddingVertical: sizes.xs,
    borderRadius: sizes.borderRadius,
  },
  draftText: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "700",
  },
});
