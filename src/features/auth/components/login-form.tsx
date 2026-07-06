"use client";

import { useAction } from "next-safe-action/hooks";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { loginAction } from "../actions/login";

export function LoginForm() {
	const router = useRouter();
	const [token, setToken] = useState("");

	const { execute, result, isExecuting } = useAction(loginAction, {
		onSuccess: () => {
			router.push("/dashboard");
			router.refresh();
		},
	});

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Mileage Tracker</CardTitle>
				<CardDescription>Enter your access token to continue</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => {
						e.preventDefault();
						execute({ token });
					}}
				>
					<Input
						type="password"
						placeholder="Access token"
						autoFocus
						value={token}
						onChange={(e) => setToken(e.target.value)}
						autoComplete="current-password"
					/>
					{(result.serverError ?? result.validationErrors?.token?._errors?.[0]) && (
						<p className="text-sm text-destructive">
							{result.serverError ?? result.validationErrors?.token?._errors?.[0]}
						</p>
					)}
					<Button type="submit" className="w-full" disabled={isExecuting || token.length === 0}>
						{isExecuting ? "Signing in…" : "Sign in"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
