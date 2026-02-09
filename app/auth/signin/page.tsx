import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to home
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#F2F2F2] overflow-hidden">
      {/* Diagonal Cross Grid Background - Top Right */}
      <div
        className="absolute top-0 right-0 w-full pointer-events-none z-0"
        style={{
          height: "600px",
          backgroundImage: `
            linear-gradient(45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%),
            linear-gradient(-45deg, transparent 49%, #e5e7eb 49%, #e5e7eb 51%, transparent 51%)
          `,
          backgroundSize: "40px 40px",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
          maskImage:
            "radial-gradient(ellipse 80% 80% at 100% 0%, #000 50%, transparent 90%)",
        }}
      />

      {/* Bottom Left Accent */}
      <div
        className="absolute bottom-0 left-0 w-96 h-96 pointer-events-none z-0 opacity-20"
        style={{
          background: "radial-gradient(circle at center, #ff6b35 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .float-animation {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

      <div className="relative z-10 w-full max-w-lg px-6">
        {/* Brand Icon */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ff6b35] rounded-2xl blur-xl opacity-30"></div>
              <div className="relative bg-gradient-to-br from-[#ff6b35] to-[#ea580c] p-4 rounded-2xl shadow-lg float-animation">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Sign-in Card */}
        <div className="relative">
          {/* Card glow effect */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#ff6b35]/20 to-[#ea580c]/20 rounded-3xl blur-lg opacity-30"></div>

          <div className="relative bg-white rounded-3xl border border-stone-200 shadow-2xl p-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-3">Welcome back</h2>
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
                className="w-full gap-3 h-14 rounded-full bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all shadow-sm hover:shadow-md text-base font-medium"
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

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
