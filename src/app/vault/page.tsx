import { VaultClient } from "@/components/vault-client";
import { getVault } from "@/lib/queries";

export default async function VaultPage() {
  const vault = await getVault();
  return <VaultClient initial={vault} />;
}
