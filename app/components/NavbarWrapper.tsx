import { safeAuth } from "@/app/lib/safe-auth";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  const session = await safeAuth();

  if (!session?.user) {
    return null;
  }

  return (
    <Navbar
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    />
  );
}
