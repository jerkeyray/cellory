import { auth } from "@/auth";
import Navbar from "./Navbar";

export default async function NavbarWrapper() {
  try {
    const session = await auth();

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
  } catch (err) {
    // Silently handle auth errors - user is not authenticated
    return null;
  }
}
