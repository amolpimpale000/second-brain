import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// TEMPORARY diagnostic — reports which Razorpay env-var NAMES the runtime can
// see (names only, never values) to distinguish a naming/casing mismatch from
// a process that hasn't restarted since the vars were added. Delete after use.
export async function GET() {
  const codes = ["IJPS", "IJSRT", "IJMPS", "IJES", "JPS"];
  const expected: Record<string, { id: boolean; secret: boolean }> = {};
  for (const c of codes) {
    expected[c] = {
      id: !!process.env[`Razorpay_Key_ID_${c}`],
      secret: !!process.env[`Razorpay_Key_Secret_${c}`],
    };
  }
  // Any env var whose name mentions razorpay (any casing) — reveals wrong casing.
  const razorpayKeyNames = Object.keys(process.env).filter((k) => /razorpay/i.test(k)).sort();

  return NextResponse.json({
    expectedNamesPresent: expected,
    allRazorpayKeyNamesSeen: razorpayKeyNames,
  });
}
