import { Call, CallContent, StreamCall, useCall, useStreamVideoClient } from "@stream-io/video-react-native-sdk";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function CallScreen() {
  const call = useCall();

  if (!call) {
    return (
      <View>
        <Text>Loading Call...</Text>
        <Text onPress={() => router.back()}>Hang Up</Text>
      </View>
    );
  }

  return (
    <StreamCall call={call}>
      <SafeAreaView style={{ flex: 1 }}>
        <CallContent onHangupCallHandler={() => router.back()} />
        {/*<TouchableOpacity>
          <Text onPress={() => router.back()}>Hang Up</Text>
        </TouchableOpacity>*/}
      </SafeAreaView>
    </StreamCall>
  );
}
