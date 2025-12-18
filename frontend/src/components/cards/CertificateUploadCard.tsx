import { Image, Text, TouchableOpacity, View } from "react-native";
import { colors, sizes } from "@/src/shared/designSystem";
import { profileStyles } from "@/src/shared/globalStyles";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";

interface CertificateUploadCardProps {
  label: string;
  certificateUri?: string;
  handleCertificateUpload: () => void;
}

const CertificateUploadCard: FC<CertificateUploadCardProps> = ({ label, certificateUri, handleCertificateUpload }) => {
  return (
    <View style={profileStyles.inputGroup}>
      <Text style={profileStyles.inputLabel}>{label}</Text>
      <TouchableOpacity
        style={{
          borderRadius: sizes.borderRadius,
          borderWidth: 1,
          borderColor: colors.lightGray,
          padding: sizes.xl,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAFAFA",
        }}
        onPress={handleCertificateUpload}
      >
        {certificateUri ? (
          <Image
            source={{ uri: certificateUri }}
            style={{
              width: "100%",
              height: 150,
              resizeMode: "contain",
            }}
          />
        ) : (
          <Ionicons name="images-outline" size={48} color={colors.lightGray} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default CertificateUploadCard;
