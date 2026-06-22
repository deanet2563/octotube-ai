import { useAuthStore } from "../store/authStore";

export function Home() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const name =
    (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">OctoTube AI 🐙</h1>
      <div className="flex items-center gap-3">
        {avatarUrl && (
          <img src={avatarUrl} alt="" className="h-10 w-10 rounded-full" />
        )}
        <span className="text-gray-700">{name}</span>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-lg bg-gray-900 px-5 py-2 font-medium text-white hover:bg-gray-700"
      >
        Sign out
      </button>
    </div>
  );
}
