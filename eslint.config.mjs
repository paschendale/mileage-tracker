import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	{ ignores: ["cloudflare-env.d.ts"] },
	...coreWebVitals,
	...nextTypescript,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "error",
		},
	},
];

export default eslintConfig;
