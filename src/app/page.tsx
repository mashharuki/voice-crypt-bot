import { Sparkles } from "lucide-react";
import { FRMonitor } from "@/components/FRMonitor";
import { VoiceAgent } from "@/components/VoiceAgent";

export default function Home() {
	return (
		<main className="relative flex min-h-screen flex-col items-center justify-center p-4 gradient-bg overflow-hidden">
			{/* Cyberpunk Grid Pattern */}
			<div className="absolute inset-0 cyber-grid opacity-30" />
			<div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background/80" />

			{/* Content */}
			<div className="relative z-10 w-full max-w-4xl">
				{/* Header */}
				<div className="text-center mb-12 animate-[fadeIn_0.6s_ease-out]">
					<div className="inline-flex items-center gap-3 mb-4">
						<Sparkles className="w-12 h-12 text-primary animate-pulse" />
						<h1 className="text-6xl font-bold neon-text">Voice Crypto Bot</h1>
						<Sparkles className="w-12 h-12 text-secondary animate-pulse" />
					</div>
					<p className="text-xl text-foreground font-medium">
						AI-Powered Trading on Hyperliquid Testnet
					</p>
				</div>

				{/* Main Content Grid */}
				<div className="grid gap-8 w-full lg:grid-cols-2 animate-[fadeIn_0.8s_ease-out_0.2s_both]">
					<VoiceAgent />
					<FRMonitor />
				</div>

				{/* Footer */}
				<footer className="mt-16 text-center text-sm text-muted-foreground animate-[fadeIn_1s_ease-out_0.4s_both]">
					<div className="flex items-center justify-center gap-2">
						<span>Powered by</span>
						<span className="font-semibold text-primary">Next.js</span>
						<span>•</span>
						<span className="font-semibold text-secondary">Mastra AI</span>
						<span>•</span>
						<span className="font-semibold text-accent">Hyperliquid</span>
					</div>
				</footer>
			</div>
		</main>
	);
}
