"use server";

import { cookies } from "next/headers";
import { returnValidationErrors } from "next-safe-action";
import { actionClient } from "@/lib/safe-action";
import { AUTH_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { loginSchema } from "../schemas/login-schema";

export const loginAction = actionClient.inputSchema(loginSchema).action(async ({ parsedInput }) => {
	if (!verifyToken(parsedInput.token)) {
		returnValidationErrors(loginSchema, { token: { _errors: ["Invalid token"] } });
	}

	const cookieStore = await cookies();
	cookieStore.set(AUTH_COOKIE_NAME, parsedInput.token, {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	});

	return { success: true as const };
});
