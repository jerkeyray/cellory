import { auth, signOut } from "@/auth";
import Link from "next/link";
import QuickActionsMenu from "./QuickActionsMenu";

export default async function Navbar() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error("[navbar] auth() failed:", err);
    session = null;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <nav className="border-b border-[#e5e5e5] bg-white dark:border-[#2a2a2a] dark:bg-[#0a0a0a]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-8 px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-[#1a1a1a] dark:text-white">
          Cellory
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/transcripts"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Transcripts
          </Link>
          <Link
            href="/calls"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Calls
          </Link>
          <Link
            href="/analytics"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Analytics
          </Link>
          <Link
            href="/compare"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Compare
          </Link>
          <Link
            href="/playbooks"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Playbooks
          </Link>
        </div>

        {/* User Menu */}
        <div className="ml-auto flex items-center gap-4">
          <QuickActionsMenu />

          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="h-8 w-8 rounded-full"
              />
            )}
            <span className="hidden text-sm text-[#666] dark:text-[#999] sm:inline">
              {session.user.name}
            </span>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/auth/signin" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-[#e5e5e5] bg-white px-3 py-1.5 text-sm font-medium text-[#1a1a1a] transition-all hover:bg-[#f5f5f5] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#2a2a2a]"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="border-t border-[#e5e5e5] px-6 py-3 dark:border-[#2a2a2a] md:hidden">
        <div className="flex gap-6">
          <Link
            href="/transcripts"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Transcripts
          </Link>
          <Link
            href="/calls"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Calls
          </Link>
          <Link
            href="/analytics"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Analytics
          </Link>
          <Link
            href="/compare"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Compare
          </Link>
          <Link
            href="/playbooks"
            className="text-sm font-medium text-[#666] transition-colors hover:text-[#ff6b35] dark:text-[#999] dark:hover:text-[#ff6b35]"
          >
            Playbooks
          </Link>
        </div>
      </div>
    </nav>
  );
}
