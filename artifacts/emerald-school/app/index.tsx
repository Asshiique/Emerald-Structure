import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

export default function IndexPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading: dataLoading } = useData();

  if (authLoading || dataLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#C0282A" }}>
        <ActivityIndicator color="#FFFFFF" size="large" />
      </View>
    );
  }

  if (!data.setupComplete) {
    return <Redirect href="/setup" />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (user.role === "admin") {
    return <Redirect href="/admin" />;
  }

  if (user.role === "teacher") {
    return <Redirect href="/teacher" />;
  }

  const isFirstLogin = !data.firstLoginParents.includes(user.email);
  if ((user.role === "parent" || user.role === "student") && isFirstLogin) {
    return <Redirect href="/welcome" />;
  }

  return <Redirect href="/(tabs)" />;
}
