import { NextResponse } from "next/server";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID;

    if (!apiKey || !agentId) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          "xi-api-key": apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Failed to get conversation token: ${errorText}` },
        { status: 500 }
      );
    }

    const body = await response.json();
    return NextResponse.json({ token: body.token });
  } catch (error) {
    console.error("Agent token error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation token" },
      { status: 500 }
    );
  }
}
