import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { executeTrade } from "@/lib/hyperliquid";

export const tradeTool = createTool({
	id: "execute-trade",
	description: "Execute a crypto trade (buy/sell) on Hyperliquid testnet.",
	inputSchema: z.object({
		symbol: z
			.string()
			.describe("The coin symbol to trade (e.g. BTC, ETH, SOL)"),
		action: z.enum(["buy", "sell"]).describe("The action to perform"),
	}),
	execute: async ({ context }) => {
		try {
			const result = await executeTrade(context.symbol, context.action);
			return { success: true, result };
		} catch (error: any) {
			return { success: false, error: error.message };
		}
	},
});
