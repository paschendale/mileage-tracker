"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

export function BottomNav() {
	const pathname = usePathname();

	return (
		<nav className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
			{NAV_LINKS.map((link) => {
				const active = pathname.startsWith(link.href);
				return (
					<Link
						key={link.href}
						href={link.href}
						className={cn(
							"relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
							active ? "text-primary" : "text-muted-foreground",
						)}
					>
						{active && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-primary" />}
						<link.icon className="size-5" />
						{link.label}
					</Link>
				);
			})}
		</nav>
	);
}
