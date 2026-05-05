import { registerPlugin } from '@capacitor/core';

interface HealthKitPlugin {
  requestAuthorization(): Promise<{ authorized: boolean }>;
  saveWorkout(options: { durationMs: number; totalVolume: number }): Promise<{ saved: boolean; calories: number }>;
}

const HealthKit = registerPlugin<HealthKitPlugin>('HealthKit');

export async function requestHealthAuthorization(): Promise<void> {
  try {
    await HealthKit.requestAuthorization();
  } catch {
    // Silently fail on web/non-native
  }
}

export async function logWorkoutToHealth(durationMs: number, totalVolume: number): Promise<void> {
  try {
    await HealthKit.requestAuthorization();
    await HealthKit.saveWorkout({ durationMs, totalVolume });
  } catch {
    // Silently fail — HealthKit is best-effort
  }
}
