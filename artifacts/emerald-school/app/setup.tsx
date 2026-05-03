import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useData } from "@/context/DataContext";

export default function SetupPage() {
  const { completeSetup } = useData();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSetup = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak Password", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await completeSetup(name.trim(), email.trim().toLowerCase(), phone.trim());
      router.replace("/login");
    } catch (e) {
      Alert.alert("Error", "Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F4F2" }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.logoBox}>
            <Image
              source={require("@/assets/images/logo.jpeg")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>First Time Setup</Text>
          <Text style={styles.headerSub}>Create your admin account to get started</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Admin Full Name</Text>
          <View style={styles.inputRow}>
            <Feather name="user" size={16} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Dr. Thomas Joseph"
              placeholderTextColor="#AAAAAA"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.fieldLabel}>Email Address</Text>
          <View style={styles.inputRow}>
            <Feather name="mail" size={16} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="admin@emeraldschool.edu"
              placeholderTextColor="#AAAAAA"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.fieldLabel}>Phone Number</Text>
          <View style={styles.inputRow}>
            <Feather name="phone" size={16} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="+91 98765 00001"
              placeholderTextColor="#AAAAAA"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={16} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor="#AAAAAA"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ paddingHorizontal: 12 }}>
              <Feather name={showPass ? "eye-off" : "eye"} size={16} color="#888882" />
            </TouchableOpacity>
          </View>

          <Text style={styles.fieldLabel}>Confirm Password</Text>
          <View style={styles.inputRow}>
            <Feather name="lock" size={16} color="#888882" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.input}
              placeholder="Repeat password"
              placeholderTextColor="#AAAAAA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPass}
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleSetup} disabled={loading} activeOpacity={0.85}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Create Admin Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 32,
    overflow: "hidden",
  },
  circle1: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(255,255,255,0.06)", top: -50, right: -40 },
  circle2: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -20 },
  logoBox: { width: 100, height: 100, backgroundColor: "#FFFFFF", borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 20, overflow: "hidden" },
  logo: { width: 90, height: 90 },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  card: { margin: 16, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "600", color: "#888882", letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, height: 48, gap: 8 },
  input: { flex: 1, fontSize: 14, color: "#1A1A1A", paddingHorizontal: 8 },
  btn: { backgroundColor: "#C0282A", borderRadius: 12, height: 50, alignItems: "center", justifyContent: "center", marginTop: 24 },
  btnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
