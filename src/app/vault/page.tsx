import { VaultClient } from "@/components/vault-client";
import { getVault, getVaultCards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const [accounts, cards] = await Promise.all([getVault(), getVaultCards()]);
  return <VaultClient accounts={accounts} cards={cards} />;
}
