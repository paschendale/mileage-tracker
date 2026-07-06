import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const AUTH_COOKIE_NAME = "mt_session";

export function verifyToken(token: string): boolean {
	const { env } = getCloudflareContext();
	return token.length > 0 && token === env.AUTH_TOKEN;
}

export async function isAuthenticated(): Promise<boolean> {
	const cookieStore = await cookies();
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
	return token !== undefined && verifyToken(token);
}

export async function requireAuth(): Promise<void> {
	if (!(await isAuthenticated())) {
		redirect("/login");
	}
}
