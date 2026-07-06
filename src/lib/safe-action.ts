import { createSafeActionClient } from "next-safe-action";
import { isAuthenticated } from "@/lib/auth";

export const actionClient = createSafeActionClient();

// Server Actions can be invoked directly (bypassing page render), so every
// mutating action re-checks auth here as defense-in-depth beyond the
// layout-level guard.
export const authActionClient = actionClient.use(async ({ next }) => {
	if (!(await isAuthenticated())) {
		throw new Error("Unauthorized");
	}
	return next();
});
