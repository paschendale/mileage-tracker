import { BarChart3, Car, Fuel, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavLink {
	href: string;
	label: string;
	icon: LucideIcon;
}

export const NAV_LINKS: NavLink[] = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/fillups", label: "Fill-ups", icon: Fuel },
	{ href: "/statistics", label: "Statistics", icon: BarChart3 },
	{ href: "/vehicles", label: "Vehicles", icon: Car },
];
