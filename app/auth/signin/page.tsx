import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to home
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-[#0a0a0a]">
      <div className="w-full max-w-md space-y-8 px-6">
        {/* Logo/Brand */}
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-[#1a1a1a] dark:text-white">
            Cellory
          </h1>
          <p className="mt-3 text-lg text-[#666] dark:text-[#999]">
            Financial Audio Intelligence
          </p>
        </div>

        {/* Sign-in Card */}
        <div className="rounded-2xl border border-[#e5e5e5] bg-white p-8 shadow-sm dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#1a1a1a] dark:text-white">
                Sign in to continue
              </h2>
              <p className="mt-2 text-sm text-[#666] dark:text-[#999]">
                Convert call recordings into structured intelligence
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-[#e5e5e5] bg-white px-4 py-3 text-sm font-medium text-[#1a1a1a] transition-all hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#2a2a2a]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#999] dark:text-[#666]">
          Built for Hotfoot AI Challenge 1: Financial Audio Intelligence
        </p>
      </div>
    </div>
  );
}
