import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete("vps_bot_session");
  return NextResponse.json({ success: true });
}
