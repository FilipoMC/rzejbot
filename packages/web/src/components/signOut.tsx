import { signOut } from "@/lib/auth";
import { SquareArrowRightExit } from "lucide-react";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <button type="submit">
        <SquareArrowRightExit className="h-5" />
      </button>
    </form>
  );
}
