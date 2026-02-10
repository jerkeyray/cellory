import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Atom01Icon } from "@hugeicons/core-free-icons";

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to home
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen w-full bg-white relative">
      {/* Dashed Top Fade Grid */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e7e5e4 1px, transparent 1px),
            linear-gradient(to bottom, #e7e5e4 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 0",
          maskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
          `,
          WebkitMaskImage: `
            repeating-linear-gradient(
              to right,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            repeating-linear-gradient(
              to bottom,
              black 0px,
              black 3px,
              transparent 3px,
              transparent 8px
            ),
            radial-gradient(ellipse 70% 60% at 50% 0%, #000 60%, transparent 100%)
          `,
          maskComposite: "intersect",
          WebkitMaskComposite: "source-in",
        }}
      />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center w-full max-w-lg mx-auto px-6 pt-8">

        {/* Sign-in Card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b35]/20 to-[#ea580c]/20 rounded-3xl blur-lg opacity-30"></div>

          <div className="relative bg-white rounded-3xl border border-stone-200 p-10">
            <div className="text-center mb-8">
              {/* Logo Icon Above Text */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-stone-200">
                  <HugeiconsIcon icon={Atom01Icon} size={24} color="#78716c" strokeWidth={1.5} />
                </div>
              </div>
              
              <h2 className="text-3xl font-semibold text-foreground mb-1">Welcome back to</h2>
              <h1 className="text-3xl font-bold text-foreground mb-3">Cellory</h1>
              
              <p className="text-muted-foreground">
                Sign in to convert your call recordings into structured intelligence
              </p>
            </div>

            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <Button
                type="submit"
                variant="outline"
                className="w-full gap-3 h-14 rounded-full text-base font-medium"
                size="lg"
              >
                {/* Colorful Google G Logo */}
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  {/* Blue */}
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  {/* Green */}
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  {/* Yellow */}
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  {/* Red */}
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
