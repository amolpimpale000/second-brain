export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const res = await fetch("https://api.ipify.org?format=json", { cache: "no-store" });
    const data = await res.json();
    return Response.json({ ip: data.ip });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
