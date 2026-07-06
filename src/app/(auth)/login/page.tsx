import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/features/auth/components/login-form";

export default async function LoginPage() {
	if (await isAuthenticated()) {
		redirect("/dashboard");
	}

	return (
		<div className="relative flex min-h-svh items-center justify-center bg-muted/30 p-4">
			<div className="absolute top-4 right-4">
				<ThemeToggle />
			</div>
			<LoginForm />
		</div>
	);
}
