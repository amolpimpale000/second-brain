import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const codes = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];
  const status: Record<string, boolean> = {};
  for (const code of codes) {
    status[code] = !!(process.env[`Razorpay_Key_ID_${code}`] && process.env[`Razorpay_Key_Secret_${code}`]);
  }
  return NextResponse.json(status);
}
