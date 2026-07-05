import { VaultClient } from "@/components/vault-client";
import { getVault } from "@/lib/queries";

export default async function VaultPage() {
  const accounts = await getVault();
  return <VaultClient accounts={accounts} />;
}
