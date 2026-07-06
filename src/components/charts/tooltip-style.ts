import type { CSSProperties } from "react";

// Recharts' Tooltip doesn't accept Tailwind classes for its content box, so
// theme-awareness has to go through inline styles referencing the same CSS
// variables the rest of the UI uses — this keeps tooltips in sync with
// light/dark mode instead of a hardcoded white box.
export const chartTooltipContentStyle: CSSProperties = {
	backgroundColor: "var(--popover)",
	borderColor: "var(--border)",
	borderRadius: "var(--radius)",
	color: "var(--popover-foreground)",
	fontSize: 12,
	boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
};

export const chartTooltipLabelStyle: CSSProperties = {
	color: "var(--popover-foreground)",
	fontWeight: 500,
};

export const chartTooltipItemStyle: CSSProperties = {
	color: "var(--popover-foreground)",
};
