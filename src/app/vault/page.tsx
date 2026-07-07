import { VaultClient } from "@/components/vault-client";
import { getVault } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const accounts = await getVault();
  return <VaultClient accounts={accounts} />;
}
