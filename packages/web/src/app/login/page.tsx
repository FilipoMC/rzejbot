import { signIn } from "@/lib/auth";

export default async function Login() {
  await signIn();
}

export const instant = false;
