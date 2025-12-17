// import { MessageSimple, MessageSimpleProps, useChannelContext, useMessageContext } from "stream-chat-expo";
// import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
// import { colors, sizes } from "../shared/designSystem";

// const handleAccept = async (message: LocalMessage, channel: ChannelType): Promise<void> => {
//   await channel.sendMessage({
//     text: `Accepted: ${message.id}`,
//     parent_id: message.id,
//   });
// };

// const handleReject = async (message: LocalMessage, channel: ChannelType): Promise<void> => {
//   await channel.sendMessage({
//     text: `Rejected: ${message.id}`,
//     parent_id: message.id,
//   });
// };

// const CustomMessageUIComponent = (props: MessageSimpleProps) => {
//   const { message } = useMessageContext();
//   const { channel } = useChannelContext();
//   // console.log("Message custom type: ", message.customType);

//   const msg = message as any;
//   if (msg.customType && msg.customType === "consultation_request") {
//     return (
//       <View style={{ flex: 1 }}>
//         <MessageSimple {...props}></MessageSimple>

//         <TouchableOpacity onPress={() => handleAccept(message, channel)} style={styles.button}>
//           <Text>Accept</Text>
//         </TouchableOpacity>

//         <TouchableOpacity onPress={() => handleReject(message, channel)} style={styles.button}>
//           <Text>Reject</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return <MessageSimple {...props} />;
// };

// const styles = StyleSheet.create({
//   button: {
//     width: 100,
//     backgroundColor: colors.inputFieldBackground,
//   },
// });

// export default CustomMessageUIComponent;
