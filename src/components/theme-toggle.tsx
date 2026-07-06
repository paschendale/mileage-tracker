"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	// Standard next-themes hydration guard: theme is unknown on the server, so
	// this defers rendering the real icon until after client mount.
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);

	if (!mounted) {
		return <Button variant="ghost" size="icon" className="invisible" aria-hidden />;
	}

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
		>
			{resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
