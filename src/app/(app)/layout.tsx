import { requireAuth } from "@/lib/auth";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
	await requireAuth();

	return <AppShell>{children}</AppShell>;
}
