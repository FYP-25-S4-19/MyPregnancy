import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { useMessageContext } from "stream-chat-expo";
import { colors, sizes } from "../shared/designSystem";
import utils from "../shared/utils";
import { useState } from "react";
import api from "../shared/api";

const ConsultationMessageFooter = () => {
  const { message } = useMessageContext();

  const [status, setStatus] = useState(message.consultData?.status);
  if (!message.consultData) {
    return null;
  }

  const handleAccept = async (): Promise<void> => {
    if (!message.consultData) {
      return;
    }

    try {
      await api.patch(`/appointments/${message.consultData.appointmentID}/accept`, {
        message_id: message.id,
      });
      setStatus("accepted");
    } catch (err) {
      console.error("Error accepting consultation request: ", err);
    }
  };

  const handleReject = async (): Promise<void> => {
    if (!message.consultData) {
      return;
    }

    try {
      await api.patch(`/appointments/${message.consultData?.appointmentID}/reject`, {
        message_id: message.id,
      });
      setStatus("rejected");
    } catch (err) {
      console.error("Error rejecting consultation request: ", err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttonContainer}>
        {status === "pending" && (
          <>
            {/*<TouchableOpacity onPress={() => handleReject(message)} style={[styles.button, styles.rejectButton]}>*/}
            <TouchableOpacity onPress={handleReject} style={[styles.button, styles.rejectButton]}>
              <Text style={{ color: colors.text }}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAccept} style={[styles.button, styles.acceptButton]}>
              <Text style={{ color: colors.text }}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      <Text style={styles.requestStatus}>
        Request Status:
        <Text style={{ fontWeight: "500" }}>{` ${utils.capitalizeFirstLetter(message.consultData?.status)}`}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    width: "100%",
    paddingBottom: sizes.s,
  },
  buttonContainer: {
    color: colors.text,
    marginLeft: sizes.xxl * 1.8,
    flexDirection: "row",
    marginTop: sizes.s,
    marginBottom: sizes.s,
  },
  button: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",

    color: colors.white,
    paddingVertical: sizes.s,
    borderRadius: sizes.s * 1.2,
    backgroundColor: colors.inputFieldBackground,
  },
  rejectButton: {
    marginRight: sizes.s,
  },
  acceptButton: {
    backgroundColor: colors.secondary,
  },
  requestStatus: {
    color: colors.text,
    marginBottom: sizes.m,
    backgroundColor: colors.secondary,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    borderRadius: sizes.s * 1.2,
  },
});

export default ConsultationMessageFooter;
