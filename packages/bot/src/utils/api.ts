import { robloxUsersByUsernamesAPIResponseSchema } from "@shared/zod/roblox/apiResponses";

export async function getRobloxUsersByIds(ids: number[]) {
  try {
    const res = await fetch("https://users.roblox.com/v1/users", {
      method: "POST",
      body: JSON.stringify({ userIds: ids, excludeBannedUsers: false }),
    });

    const body = robloxUsersByUsernamesAPIResponseSchema.parse(
      await res.json(),
    );

    return body.data.map((v) => {
      return { id: v.id, name: v.name, displayName: v.displayName };
    });
  } catch (e) {
    console.error(e);
    return null;
  }
}
