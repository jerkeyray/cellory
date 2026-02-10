import { safeAuth } from "@/app/lib/safe-auth";
import Sidebar from "./Sidebar";

export default async function SidebarWrapper() {
  const session = await safeAuth();

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
}
