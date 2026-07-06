import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
	if (await isAuthenticated()) {
		redirect("/dashboard");
	}

	return (
		<div className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
			<LoginForm />
		</div>
	);
}
