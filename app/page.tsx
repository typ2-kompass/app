import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const runtime = "edge";

// mein.typ2-kompass.de is the app subdomain; marketing lives on WordPress at
// www.typ2-kompass.de. Logged-in users land on /account; everyone else goes to
// /login.
export default async function RootPage() {
  const session = await auth();
  redirect(session?.user ? "/account" : "/login");
}
