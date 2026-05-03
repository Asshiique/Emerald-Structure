import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "@/context/AuthContext";

const LOGO = require("../assets/images/logo.jpeg");

export default function LoginPage() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isWeb = Platform.OS === "web";

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      router.replace("/(tabs)");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1, backgroundColor: "#F5F4F2" }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.topSection,
            { paddingTop: isWeb ? 80 : insets.top + 40 },
          ]}
        >
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.logoContainer}>
            <View style={styles.logoCard}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="cover" />
            </View>
          </View>
        </View>

        <View style={[styles.bottomSection, { paddingBottom: isWeb ? 34 : insets.bottom + 24 }]}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Sign in to continue</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <Feather name="mail" size={16} color="#888882" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#888882"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Feather name="lock" size={16} color="#888882" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor="#888882"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#888882" />
            </TouchableOpacity>
          </View>

          <View style={styles.forgotRow}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerOr}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo Login</Text>
            <Text style={styles.demoText}>Use any email to sign in (demo mode)</Text>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => { setEmail("parent@emerald.edu"); setPassword("demo123"); }}
              activeOpacity={0.7}
            >
              <Text style={styles.demoBtnText}>Use Demo Account</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Emerald? </Text>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Contact school office</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: {
    backgroundColor: "#C0282A",
    paddingHorizontal: 24,
    paddingBottom: 40,
    overflow: "hidden",
  },
  circle1: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -30,
    right: -30,
  },
  circle2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.06)",
    bottom: 0,
    left: -20,
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    alignSelf: "stretch",
    overflow: "hidden",
    marginHorizontal: 0,
  },
  logoImage: {
    width: "100%",
    height: 200,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -2,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: "#888882",
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: "#F8EBEB",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: "#C0282A",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F4F2",
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
  },
  eyeBtn: {
    padding: 4,
  },
  forgotRow: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 4,
  },
  forgotText: {
    fontSize: 13,
    color: "#C0282A",
    fontWeight: "500",
  },
  signInBtn: {
    height: 50,
    backgroundColor: "#C0282A",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  signInBtnDisabled: {
    opacity: 0.7,
  },
  signInText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  dividerOr: {
    fontSize: 12,
    color: "#888882",
  },
  demoBox: {
    backgroundColor: "#FFF8EC",
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B6010",
    marginBottom: 2,
  },
  demoText: {
    fontSize: 12,
    color: "#8B6010",
    marginBottom: 10,
  },
  demoBtn: {
    backgroundColor: "#C8972A",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  demoBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 13,
    color: "#888882",
  },
  footerLink: {
    fontSize: 13,
    fontWeight: "500",
    color: "#C0282A",
  },
});
