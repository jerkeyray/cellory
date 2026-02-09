import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AgentClient from "./AgentClient";
import { prisma } from "@/app/lib/prisma";

export default async function AgentPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const playbooks = await prisma.playbook.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Agent</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Give the voice agent your playbook context and test how it guides conversations.
          </p>
        </div>

        <AgentClient playbooks={playbooks} />
      </div>
    </div>
  );
}
