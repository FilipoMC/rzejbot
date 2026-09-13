import { usersByIdResponseSchema } from "@shared/zod/roblox/apiResponses";
import { cacheLife } from "next/cache";

export async function getRobloxUsersByIds(ids: number[]) {
  "use cache";
  cacheLife("days");

  try {
    const res = await fetch("https://users.roblox.com/v1/users", {
      method: "POST",
      body: JSON.stringify({ userIds: ids, excludeBannedUsers: false }),
    });

    const body = usersByIdResponseSchema.parse(await res.json());

    return body.data.map((v) => {
      return { id: v.id, name: v.name, displayName: v.displayName };
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}
