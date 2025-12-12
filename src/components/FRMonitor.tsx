"use client";

import { AlertCircle, Bell, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type AssetCtx = {
	funding: string;
	openInterest: string;
	prevDayPx: string;
	dayNtlVlm: string;
	premium: string;
	oraclePx: string;
	markPx: string;
	midPx: string;
	impactPxs: string[] | null;
};
type Meta = {
	universe: { name: string }[];
};
type MetaAndAssetCtxs = [Meta, AssetCtx[]];

export function FRMonitor() {
	const [highFrSymbols, setHighFrSymbols] = useState<
		{ name: string; fr: number }[]
	>([]);
	const [notificationsEnabled] = useState(true); // Always enabled
	const [lastNotified, setLastNotified] = useState<number>(0);
	const [isLoading, setIsLoading] = useState(true);
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted) return;

		const fetchFR = async () => {
			try {
				const res = await fetch("/api/fr");
				if (!res.ok) return;

				const data: MetaAndAssetCtxs = await res.json();
				const [meta, assetCtxs] = data;

				console.log(data);

				const abnormal = assetCtxs
					.map((ctx, i) => ({
						name: meta.universe[i].name,
						fr: parseFloat(ctx.funding),
					}))
					.filter((item) => Math.abs(item.fr) >= 0.001); // 0.1%

				setHighFrSymbols(abnormal);
				setIsLoading(false);

				// Show toast notification
				const now = Date.now();
				if (
					abnormal.length > 0 &&
					notificationsEnabled &&
					now - lastNotified > 60000
				) {
					toast.error("High FR Alert: " + abnormal[0].name, {
						description:
							"Funding Rate: " + (abnormal[0].fr * 100).toFixed(4) + "%",
						duration: 5000,
					});
					setLastNotified(now);
				}
			} catch (e) {
				console.error("Failed to fetch FR:", e);
				setIsLoading(false);
			}
		};

		const interval = setInterval(fetchFR, 10000);
		fetchFR();
		return () => clearInterval(interval);
	}, [notificationsEnabled, lastNotified, isMounted]);

	const getFRColor = (fr: number) => {
		const absFr = Math.abs(fr);
		if (absFr >= 0.002) return "text-red-400";
		if (absFr >= 0.001) return "text-yellow-400";
		return "text-green-400";
	};

	return (
		<Card className="w-full h-[600px] flex flex-col glass border-2 border-white/10 shadow-2xl hover:border-white/20 transition-all duration-300">
			<CardHeader className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
				<CardTitle className="flex items-center gap-3 text-2xl">
					<div className="p-2 rounded-lg bg-white/10">
						<TrendingUp className="w-6 h-6 text-white" />
					</div>
					<span className="text-white font-bold">FR Monitor</span>
					<div className="ml-auto flex items-center gap-2 text-sm text-green-400">
						<Bell className="w-4 h-4" />
						<span className="font-semibold">通知ON</span>
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent className="flex-1 overflow-auto p-6">
				{isLoading ? (
					<div className="flex items-center justify-center h-full">
						<div className="flex gap-2">
							<div
								className="w-3 h-3 bg-white/70 rounded-full animate-bounce"
								style={{ animationDelay: "0ms" }}
							/>
							<div
								className="w-3 h-3 bg-white/70 rounded-full animate-bounce"
								style={{ animationDelay: "150ms" }}
							/>
							<div
								className="w-3 h-3 bg-white/70 rounded-full animate-bounce"
								style={{ animationDelay: "300ms" }}
							/>
						</div>
					</div>
				) : highFrSymbols.length === 0 ? (
					<div className="flex flex-col items-center justify-center h-full text-center">
						<div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-6 border-2 border-green-500/30">
							<TrendingUp className="w-10 h-10 text-green-400" />
						</div>
						<p className="text-2xl font-bold text-green-400 mb-3">All Clear</p>
						<p className="text-base text-white/60 font-medium">
							All symbols &lt; 0.1% FR
						</p>
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-red-500/10 border-2 border-red-500/30">
							<AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
							<p className="font-bold text-red-400 text-lg">
								Abnormal FR Detected
							</p>
						</div>
						<div className="space-y-3">
							{highFrSymbols.map((s) => (
								<div
									key={s.name}
									className="flex justify-between items-center p-5 rounded-xl bg-white/5 border-2 border-white/10 hover:border-white/20 hover:bg-white/10 transition-all animate-[fadeIn_0.3s_ease-out]"
								>
									<span className="font-bold text-white text-xl">{s.name}</span>
									<div className="flex items-center gap-3">
										<span className={`font-bold text-2xl ${getFRColor(s.fr)}`}>
											{(s.fr * 100).toFixed(4)}%
										</span>
										{s.fr > 0 ? (
											<TrendingUp className="w-6 h-6 text-green-400" />
										) : (
											<TrendingDown className="w-6 h-6 text-red-400" />
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
