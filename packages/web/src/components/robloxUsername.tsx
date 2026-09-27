import { getRobloxUsersByIds } from "@/lib/api";

export default async function RobloxUsername({
  robloxId,
}: {
  robloxId: number;
}) {
  const users = await getRobloxUsersByIds([robloxId]);

  return <>{users?.[0]?.displayName ?? "N/A"}</>;
}
