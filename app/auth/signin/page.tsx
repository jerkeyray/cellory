import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Sign in to Cellory</h1>
      <p className="max-w-md text-center text-zinc-600">
        Configure one or more providers in <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-700">auth.ts</code> (e.g. Google, GitHub)
        and set the required env vars (e.g. <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-700">AUTH_GOOGLE_ID</code>,{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 text-sm dark:bg-zinc-700">AUTH_GOOGLE_SECRET</code>).
      </p>
      <form
        action={async () => {
          "use server";
          await signIn(undefined, { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
