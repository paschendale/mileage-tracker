"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "./nav-links";

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:bg-background">
			<div className="flex h-16 items-center px-6">
				<span className="text-lg font-semibold tracking-tight">Mileage Tracker</span>
			</div>
			<nav className="flex-1 space-y-1 px-3">
				{NAV_LINKS.map((link) => {
					const active = pathname.startsWith(link.href);
					return (
						<Link
							key={link.href}
							href={link.href}
							className={cn(
								"flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
								active
									? "bg-muted text-foreground"
									: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
							)}
						>
							<link.icon className="size-4" />
							{link.label}
						</Link>
					);
				})}
			</nav>
		</aside>
	);
}
