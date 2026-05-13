import { registerPlugin } from '@capacitor/core';

interface HealthKitPlugin {
  requestAuthorization(): Promise<{ authorized: boolean }>;
  saveWorkout(options: { durationMs: number; totalVolume: number }): Promise<{ saved: boolean; calories: number }>;
}

const HealthKit = registerPlugin<HealthKitPlugin>('HealthKit');

export async function requestHealthAuthorization(): Promise<{ granted: boolean; error?: string }> {
  try {
    const result = await HealthKit.requestAuthorization();
    return { granted: result.authorized };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : String(e);
    return { granted: false, error };
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
