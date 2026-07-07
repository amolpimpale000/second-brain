import net from "net";

export const dynamic = "force-dynamic";

function tcpProbe(host: string, port: number, timeoutMs = 8000): Promise<string> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => {
      socket.destroy();
      resolve("connected");
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve("timeout");
    });
    socket.on("error", (err) => {
      resolve(`error: ${err.message}`);
    });
    socket.connect(port, host);
  });
}

export async function GET() {
  const host = process.env.JOURNAL_JPS_DB_HOST || "147.93.31.183";
  const port = Number(process.env.JOURNAL_JPS_DB_PORT || "5432");
  const tcp = await tcpProbe(host, port);
  return Response.json({ host, port, tcp });
}
