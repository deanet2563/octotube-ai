import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function Login() {
  const session = useAuthStore((s) => s.session);
  const loading = useAuthStore((s) => s.loading);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);

  if (!loading && session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-gray-900">OctoTube AI 🐙</h1>
        <p className="mt-2 text-gray-500">Turn YouTube videos into visual knowledge</p>
      </div>
      <button
        onClick={() => signInWithGoogle()}
        className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 shadow-sm hover:bg-gray-50"
      >
        Continue with Google
      </button>
    </div>
  );
}
