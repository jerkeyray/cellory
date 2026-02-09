import { auth } from "@/auth";
import Sidebar from "./Sidebar";

export default async function SidebarWrapper() {
  try {
    const session = await auth();

    if (!session?.user) {
      return null;
    }

    return (
      <Sidebar
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
