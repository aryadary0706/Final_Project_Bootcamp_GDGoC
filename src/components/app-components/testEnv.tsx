"use client";

export default function TestEnv() {
  console.log("TestEnv - Google Client ID:", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <h3 className="font-bold">Environment Test</h3>
      <p>Google Client ID: {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? "✅ Set" : "❌ Not set"}</p>
      <p>Check browser console for more details</p>
    </div>
  );
}
