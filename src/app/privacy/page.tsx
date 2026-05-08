export default function PrivacyPage() {
  const s = {
    page: { maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#1a1a1a', lineHeight: 1.6 },
    h1: { fontSize: 28, fontWeight: 700, marginBottom: 8 },
    date: { fontSize: 14, color: '#666', marginBottom: 40 },
    h2: { fontSize: 18, fontWeight: 700, marginTop: 36, marginBottom: 10 },
    p: { fontSize: 15, marginBottom: 14, color: '#333' },
    ul: { paddingLeft: 20, marginBottom: 14 },
    li: { fontSize: 15, color: '#333', marginBottom: 6 },
  };

  return (
    <div style={s.page}>
      <h1 style={s.h1}>Privacy Policy</h1>
      <div style={s.date}>Wain's Workout App · Last updated May 8, 2026</div>

      <h2 style={s.h2}>Overview</h2>
      <p style={s.p}>
        Wain's Workout App ("the App") is a personal AI-assisted fitness coaching application. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your data.
      </p>

      <h2 style={s.h2}>Information We Collect</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong>Account information:</strong> Name and email address when you create an account.</li>
        <li style={s.li}><strong>Workout data:</strong> Exercise logs, sets, reps, weights, session duration, and workout history you record in the app.</li>
        <li style={s.li}><strong>Body metrics:</strong> Bodyweight if you choose to enter it.</li>
        <li style={s.li}><strong>Health data (iOS only):</strong> With your permission, the app writes completed workout summaries (duration and estimated calories) to Apple Health. We do not read any data from Apple Health.</li>
        <li style={s.li}><strong>Feedback:</strong> Any messages you submit through the in-app feedback form.</li>
      </ul>

      <h2 style={s.h2}>How We Use Your Information</h2>
      <ul style={s.ul}>
        <li style={s.li}>To provide workout tracking, AI program generation, and coaching features.</li>
        <li style={s.li}>To sync your data across devices when you are signed in.</li>
        <li style={s.li}>To write workout summaries to Apple Health so your fitness activity is reflected in your health record.</li>
        <li style={s.li}>To improve the app based on aggregated, anonymized usage patterns.</li>
      </ul>

      <h2 style={s.h2}>Apple Health / HealthKit</h2>
      <p style={s.p}>
        On iOS, the App requests permission to write workout data to Apple Health (HealthKit). This includes workout type, duration, and estimated calories burned. We only write data — we do not read or access any existing health data. HealthKit data is never used for advertising or shared with third parties.
      </p>

      <h2 style={s.h2}>Data Storage</h2>
      <p style={s.p}>
        Your account data and workout history are stored securely using Supabase, a cloud database provider. Data is encrypted in transit (TLS) and at rest. If you use the app without an account, data is stored locally on your device only.
      </p>

      <h2 style={s.h2}>Third-Party Services</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong>Supabase:</strong> Authentication and cloud data storage.</li>
        <li style={s.li}><strong>Anthropic Claude API:</strong> AI-generated workout programs and coaching responses. Workout context is sent to generate responses but is not stored by Anthropic beyond the request.</li>
        <li style={s.li}><strong>MuscleWiki API:</strong> Exercise demonstration videos streamed on demand. We hold a valid paid subscription to this API.</li>
      </ul>

      <h2 style={s.h2}>Data Sharing</h2>
      <p style={s.p}>
        We do not sell, rent, or share your personal information with third parties for advertising or marketing purposes. Data is only shared with the service providers listed above to the extent necessary to operate the app.
      </p>

      <h2 style={s.h2}>Your Rights</h2>
      <ul style={s.ul}>
        <li style={s.li}><strong>Access:</strong> You can view all your data within the app.</li>
        <li style={s.li}><strong>Deletion:</strong> You can permanently delete your account and all associated data from the Account tab → Danger Zone → Delete Account.</li>
        <li style={s.li}><strong>Export:</strong> Contact us to request a copy of your data.</li>
      </ul>

      <h2 style={s.h2}>Children's Privacy</h2>
      <p style={s.p}>
        This app is not directed at children under 13. We do not knowingly collect personal information from children under 13.
      </p>

      <h2 style={s.h2}>Contact</h2>
      <p style={s.p}>
        Questions about this Privacy Policy? Contact us at <a href="mailto:wain@kellum.net" style={{ color: '#16a34a' }}>wain@kellum.net</a>.
      </p>
    </div>
  );
}
