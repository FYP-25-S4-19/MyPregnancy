import { View, TextInput, Button, StyleSheet, Text } from "react-native";
import { MeData } from "@/src/shared/typesAndInterfaces";
import useAuthStore from "@/src/shared/authStore";
import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { router } from "expo-router";
import api from "@/src/shared/api";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { setMe, setAccessToken, clearAuthState: logout } = useAuthStore((state) => state);
  // useEffect(() => {
  //   try {
  //     console.log("Me Data: ", me);
  //   } catch (err) {
  //     console.error("JWT Decode error: ", err);
  //   }
  // }, [me]);

  const handleLogin = async () => {
    const email_trim = email.trim();
    const password_trim = password.trim();
    alert(`Logging in with Email: ${email_trim} and Password: ${password_trim}`);

    try {
      const params = new URLSearchParams();
      params.append("username", email_trim);
      params.append("password", password_trim);
      const loginRes = await api.post("/auth/jwt/login", params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const accessToken: string = loginRes.data.access_token;
      setAccessToken(accessToken);

      // Sanity check to ensure valid JWT - will throw if invalid
      jwtDecode(accessToken);

      const meRes = await api.get("/users/me");
      const meData: MeData = meRes.data;
      setMe(meData);
      router.push("/main");
    } catch (err) {
      console.error(err);
      logout();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="default"
        returnKeyType="next"
        placeholderTextColor="#333"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true} // hides input
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        placeholderTextColor="#333"
      />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 16,
  },
  input: {
    height: 44,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 4,
    color: "#333",
  },
});
