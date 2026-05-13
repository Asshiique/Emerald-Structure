import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";

const LOGO = require("../assets/images/logo.jpeg");

export default function LoginPage() {
  const { login, requestPasswordReset, lastAuthError } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const isWeb = Platform.OS === "web";

  // ── Entrance animations ──────────────────────────────────────────────────
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(60);
  const formOpacity = useSharedValue(0);

  useEffect(() => {
    // Logo bounces in
    logoScale.value = withSpring(1, { damping: 12, stiffness: 150 });
    logoOpacity.value = withTiming(1, { duration: 300 });
    // Form panel slides up 100ms later
    formTranslateY.value = withDelay(100, withSpring(0, { damping: 20, stiffness: 160 }));
    formOpacity.value = withDelay(100, withTiming(1, { duration: 280 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
    opacity: formOpacity.value,
  }));


  const mapAuthError = (code?: string) => {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/invalid-login-credentials":
        return "Invalid email or password.";
      case "auth/user-not-found":
        return "No account found for this email.";
      case "auth/wrong-password":
        return "Wrong password.";
      case "auth/too-many-requests":
        return "Too many attempts. Try again later or reset your password.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/operation-not-allowed":
        return "Email/password sign-in is disabled in Firebase for this app.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "profile/missing":
        return "Account exists, but profile data is missing. Contact admin support.";
      default:
        return "";
    }
  };

  const handleLogin = async (nextEmail = email, nextPassword = password) => {
    setError("");
    setInfo("");
    if (!nextEmail.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await login(nextEmail, nextPassword);
    setLoading(false);
    if (result.success) {
      router.replace("/");
    } else {
      // Read the error code directly from the result — not from lastAuthError state
      // which is async and would be stale on this render.
      const msg = mapAuthError(result.code) || "Sign-in failed. Please try again.";
      const detail = result.code ? ` (${result.code})` : "";
      setError(`${msg}${detail}`);
    }
  };

  const handleReset = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Enter your email first, then tap Reset password.");
      return;
    }
    setLoading(true);
    const ok = await requestPasswordReset(email);
    setLoading(false);
    if (ok) setInfo("Password reset email sent. Check your inbox (and spam).");
    else {
      const msg = mapAuthError(lastAuthError?.code) || "Unable to send reset email.";
      const detail = lastAuthError?.code ? ` (${lastAuthError.code})` : "";
      setError(`${msg}${detail}`);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: "#F5F4F2" }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.topSection, { paddingTop: isWeb ? 80 : insets.top + 40 }]}>
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
            <View style={styles.logoCard}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="cover" />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.bottomSection, { paddingBottom: isWeb ? 34 : insets.bottom + 24 }, formAnimStyle]}>
          <Text style={styles.welcomeTitle}>Welcome back</Text>
          <Text style={styles.welcomeSub}>Sign in to continue</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          {info ? <View style={styles.infoBox}><Text style={styles.infoText}>{info}</Text></View> : null}

          <View style={styles.inputWrapper}>
            <Feather name="mail" size={16} color="#888882" style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder="Email address" placeholderTextColor="#888882" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
          </View>

          <View style={[styles.inputWrapper, { marginTop: 12 }]}>
            <Feather name="lock" size={16} color="#888882" style={styles.inputIcon} />
            <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor="#888882" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#888882" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.signInBtn, loading && styles.signInBtnDisabled]} onPress={() => handleLogin()} activeOpacity={0.85} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.signInText}>Sign In</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.85} disabled={loading}>
            <Text style={styles.resetText}>Reset password</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  topSection: { backgroundColor: "#C0282A", paddingHorizontal: 24, paddingBottom: 40, overflow: "hidden" },
  circle1: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: "rgba(255,255,255,0.08)", top: -30, right: -30 },
  circle2: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.06)", bottom: 0, left: -20 },
  logoContainer: { alignItems: "center", justifyContent: "center" },
  logoCard: { backgroundColor: "#FFFFFF", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 4, alignSelf: "stretch", overflow: "hidden" },
  logoImage: { width: "100%", height: 200 },
  bottomSection: { flex: 1, backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -2, paddingHorizontal: 24, paddingTop: 28 },
  welcomeTitle: { fontSize: 22, fontWeight: "700", color: "#1A1A1A", marginBottom: 4 },
  welcomeSub: { fontSize: 13, color: "#888882", marginBottom: 24 },
  errorBox: { backgroundColor: "#F8EBEB", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, color: "#C0282A" },
  infoBox: { backgroundColor: "#ECF7EF", borderRadius: 10, padding: 12, marginBottom: 16 },
  infoText: { fontSize: 13, color: "#1E6B3A" },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: "#F5F4F2", borderRadius: 10, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.12)", paddingHorizontal: 14, height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: "#1A1A1A" },
  eyeBtn: { padding: 4 },
  signInBtn: { height: 50, backgroundColor: "#C0282A", borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 16 },
  signInBtnDisabled: { opacity: 0.7 },
  signInText: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  resetBtn: { alignSelf: "center", paddingVertical: 14, paddingHorizontal: 14, marginTop: 6 },
  resetText: { fontSize: 13, color: "#888882", fontWeight: "600" },
});
