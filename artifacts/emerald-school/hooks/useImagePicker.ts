import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native";

export async function pickImageFromLibrary(): Promise<string | null> {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to upload a photo.");
      return null;
    }
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return `data:image/jpeg;base64,${result.assets[0].base64}`;
}

export async function pickImageFromCamera(): Promise<string | null> {
  if (Platform.OS !== "web") {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access to take a photo.");
      return null;
    }
  }
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });
  if (result.canceled || !result.assets[0]?.base64) return null;
  return `data:image/jpeg;base64,${result.assets[0].base64}`;
}

export async function pickImageWithChoice(): Promise<string | null> {
  return new Promise((resolve) => {
    if (Platform.OS === "web") {
      pickImageFromLibrary().then(resolve);
      return;
    }
    Alert.alert("Upload Photo", "Choose how to add a photo", [
      { text: "Camera", onPress: () => pickImageFromCamera().then(resolve) },
      { text: "Photo Library", onPress: () => pickImageFromLibrary().then(resolve) },
      { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
}
