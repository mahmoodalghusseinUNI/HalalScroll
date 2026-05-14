import {
  requireOptionalNativeModule
} from "expo-modules-core";
import { Platform } from "react-native";

const NativeHalalScreenTime =
  Platform.OS === "ios" ? requireOptionalNativeModule("HalalScreenTime") : null;

export default {
  async requestAuthorization(): Promise<boolean> {
    if (!NativeHalalScreenTime) return false;
    return await NativeHalalScreenTime.requestAuthorization();
  },

  getAuthorizationStatus(): string {
    if (!NativeHalalScreenTime) return "unavailable";
    return NativeHalalScreenTime.getAuthorizationStatus();
  },

  hasSelection(): boolean {
    if (!NativeHalalScreenTime) return false;
    return NativeHalalScreenTime.hasSelection();
  },

  enableBlocking(): boolean {
    if (!NativeHalalScreenTime) return false;
    return NativeHalalScreenTime.enableBlocking();
  },

  disableBlocking(): boolean {
    if (!NativeHalalScreenTime) return false;
    return NativeHalalScreenTime.disableBlocking();
  },

  showPicker(): boolean {
    if (!NativeHalalScreenTime) return false;
    return NativeHalalScreenTime.showPicker();
  },
};
