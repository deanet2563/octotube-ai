import { useAuthStore } from "../store/authStore";

export function Header() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <span className="text-lg font-semibold">OctoTube AI 🐙</span>
      <div className="flex items-center gap-3 text-sm text-gray-600">
        <span>{name}</span>
        <button
          onClick={() => signOut()}
          className="rounded-md border border-gray-300 px-3 py-1 hover:bg-gray-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
