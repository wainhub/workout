import { registerPlugin } from '@capacitor/core';

interface HealthKitPlugin {
  requestAuthorization(): Promise<{ authorized: boolean }>;
  saveWorkout(options: { durationMs: number; totalVolume: number }): Promise<{ saved: boolean; calories: number }>;
}

const HealthKit = registerPlugin<HealthKitPlugin>('HealthKit');

export async function requestHealthAuthorization(): Promise<boolean> {
  try {
    const result = await HealthKit.requestAuthorization();
    return result.authorized;
  } catch {
    // Silently fail on web/non-native
    return false;
  }
}

export async function logWorkoutToHealth(durationMs: number, totalVolume: number): Promise<boolean> {
  try {
    await HealthKit.requestAuthorization();
    const result = await HealthKit.saveWorkout({ durationMs, totalVolume });
    return result.saved;
  } catch {
    // Silently fail — HealthKit is best-effort
    return false;
  }
}
