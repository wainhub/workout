import Capacitor
import HealthKit

@objc(HealthKitPlugin)
public class HealthKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "HealthKitPlugin"
    public let jsName = "HealthKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "requestAuthorization", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "saveWorkout", returnType: CAPPluginReturnPromise),
    ]

    private let store = HKHealthStore()

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available on this device")
            return
        }
        let types: Set<HKSampleType> = [
            HKObjectType.workoutType(),
            HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
        ]
        store.requestAuthorization(toShare: types, read: nil) { success, error in
            if success {
                call.resolve(["authorized": true])
            } else {
                call.reject(error?.localizedDescription ?? "Authorization denied")
            }
        }
    }

    @objc func saveWorkout(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit not available")
            return
        }

        let durationMs = call.getDouble("durationMs") ?? 0
        let totalVolume = call.getDouble("totalVolume") ?? 0

        // Rough calorie estimate: ~4 cal per 1000 lb volume + base burn
        let durationMin = durationMs / 60000
        let calories = (totalVolume / 1000.0 * 4.0) + (durationMin * 4.0)

        let endDate = Date()
        let startDate = endDate.addingTimeInterval(-durationMs / 1000.0)

        let energyBurned = HKQuantity(unit: .kilocalorie(), doubleValue: calories)

        let config = HKWorkoutConfiguration()
        config.activityType = .traditionalStrengthTraining
        config.locationType = .indoor

        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())

        builder.beginCollection(withStart: startDate) { success, error in
            guard success else {
                call.reject(error?.localizedDescription ?? "Failed to begin workout")
                return
            }

            let energySample = HKQuantitySample(
                type: HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!,
                quantity: energyBurned,
                start: startDate,
                end: endDate
            )

            builder.add([energySample]) { success, error in
                guard success else {
                    call.reject(error?.localizedDescription ?? "Failed to add samples")
                    return
                }

                builder.endCollection(withEnd: endDate) { success, error in
                    guard success else {
                        call.reject(error?.localizedDescription ?? "Failed to end collection")
                        return
                    }

                    builder.finishWorkout { workout, error in
                        if let _ = workout {
                            call.resolve(["saved": true, "calories": calories])
                        } else {
                            call.reject(error?.localizedDescription ?? "Failed to save workout")
                        }
                    }
                }
            }
        }
    }
}
