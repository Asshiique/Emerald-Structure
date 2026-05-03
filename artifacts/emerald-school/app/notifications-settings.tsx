import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotifPrefs {
  notices: boolean;
  homework: boolean;
  fees: boolean;
  events: boolean;
}

const DEFAULT_PREFS: NotifPrefs = {
  notices: true,
  homework: true,
  fees: true,
  events: true,
};

const STORAGE_KEY = "@emerald_notif_prefs";

export default function NotificationsSettingsPage() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPad = isWeb ? 34 : insets.bottom;

  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setPrefs(JSON.parse(stored)); } catch {}
      }
    });
    if (Platform.OS !== "web") {
      Notifications.getPermissionsAsync().then(({ status }) => {
        setPermissionStatus(status);
      });
    }
  }, []);

  const updatePref = async (key: keyof NotifPrefs, value: boolean) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const requestPermission = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Not supported", "Push notifications require the Expo Go app on your phone.");
      return;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") {
      Alert.alert("Notifications enabled", "You'll now receive school notifications.");
    } else {
      Alert.alert("Permission denied", "Enable notifications from your phone's Settings app.");
    }
  };

  const sendTestNotification = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Test notification", "Notifications work on the Expo Go mobile app. Scan the QR code to try on your phone.");
      return;
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please enable notifications first.");
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Emerald International School",
        body: "Test notification — your notifications are working perfectly!",
        data: { type: "test" },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
    Alert.alert("Sent!", "You should receive a test notification in a moment.");
  };

  const isGranted = permissionStatus === "granted";

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F4F2" }}>
      <View style={[styles.header, { paddingTop: isWeb ? 67 : insets.top }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {!isGranted && Platform.OS !== "web" && (
          <TouchableOpacity style={styles.permBanner} onPress={requestPermission} activeOpacity={0.8}>
            <Feather name="bell-off" size={20} color="#C0282A" />
            <View style={{ flex: 1 }}>
              <Text style={styles.permTitle}>Notifications are off</Text>
              <Text style={styles.permSub}>Tap to enable school notifications</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#C0282A" />
          </TouchableOpacity>
        )}

        {(isGranted || Platform.OS === "web") && (
          <View style={styles.permGranted}>
            <Feather name="check-circle" size={18} color="#27500A" />
            <Text style={styles.permGrantedText}>Notifications are enabled</Text>
          </View>
        )}

        <Text style={styles.sectionLabel}>NOTIFY ME ABOUT</Text>
        <View style={styles.card}>
          {(
            [
              { key: "notices" as const, icon: "bell", label: "New Notices", desc: "School announcements and alerts" },
              { key: "homework" as const, icon: "book", label: "New Homework", desc: "When teachers post assignments" },
              { key: "fees" as const, icon: "credit-card", label: "Fee Reminders", desc: "Due dates and overdue alerts" },
              { key: "events" as const, icon: "calendar", label: "Event Reminders", desc: "School events and programs" },
            ] as const
          ).map((item, i, arr) => (
            <View
              key={item.key}
              style={[styles.toggleRow, i < arr.length - 1 && styles.toggleBorder]}
            >
              <View style={styles.toggleIcon}>
                <Feather name={item.icon as any} size={18} color="#C0282A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>{item.label}</Text>
                <Text style={styles.toggleDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={prefs[item.key]}
                onValueChange={(v) => updatePref(item.key, v)}
                trackColor={{ false: "#E0E0E0", true: "#F8EBEB" }}
                thumbColor={prefs[item.key] ? "#C0282A" : "#AAAAAA"}
                ios_backgroundColor="#E0E0E0"
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>TEST</Text>
        <TouchableOpacity style={styles.testBtn} onPress={sendTestNotification} activeOpacity={0.8}>
          <Feather name="send" size={16} color="#FFFFFF" />
          <Text style={styles.testBtnText}>Send Test Notification</Text>
        </TouchableOpacity>
        <Text style={styles.testNote}>
          Sends a sample notification immediately to confirm everything is working.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#C0282A",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
  },
  permBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8EBEB",
    borderRadius: 14,
    padding: 14,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(192,40,42,0.2)",
  },
  permTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#8B1A1B",
  },
  permSub: {
    fontSize: 12,
    color: "#C0282A",
    marginTop: 2,
  },
  permGranted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EAF3DE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  permGrantedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#27500A",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#888882",
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8EBEB",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  toggleDesc: {
    fontSize: 11,
    color: "#888882",
    marginTop: 2,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#C0282A",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
  },
  testBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  testNote: {
    fontSize: 12,
    color: "#888882",
    textAlign: "center",
    lineHeight: 18,
  },
});
