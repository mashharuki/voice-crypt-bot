import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { ethers } from "ethers";
import { NextResponse } from "next/server";

const TESTNET_API_URL = "https://api.hyperliquid-testnet.xyz";

export async function POST(req: Request) {
	try {
		const { symbol, action } = await req.json();
		const privateKey = process.env.PRIVATE_KEY;

		if (!privateKey) {
			return NextResponse.json(
				{ error: "PRIVATE_KEY not set in .env" },
				{ status: 500 },
			);
		}

		const wallet = new ethers.Wallet(privateKey);
		const transport = new HttpTransport({ isTestnet: true });

		// SDK Instantiation
		// Assuming InfoClient and ExchangeClient take transport
		const infoClient = new InfoClient({ transport });
		const exchangeClient = new ExchangeClient({ wallet, transport });

		// 1. Get Meta to find Asset ID
		const meta = await infoClient.meta();
		const coin = symbol.toUpperCase();
		const assetIndex = meta.universe.findIndex((u: any) => u.name === coin);

		if (assetIndex === -1) {
			return NextResponse.json(
				{ error: `Symbol ${coin} not found` },
				{ status: 400 },
			);
		}

		const isBuy = action.toLowerCase() === "buy";
		// Size and Price logic - Testnet/Demo values
		const sz = coin === "BTC" || coin === "ETH" ? 0.01 : 1;
		const limitPx = isBuy ? "100000" : "0.1"; // Aggressive Limit for Market Execution. Strings for safe precision.

		// 2. Place Order
		const result = await exchangeClient.order({
			orders: [
				{
					a: assetIndex,
					b: isBuy,
					p: limitPx,
					s: sz.toString(),
					r: false,
					t: { limit: { tif: "Gtc" } },
				},
			],
			grouping: "na",
		});

		if (result.status === "ok") {
			// It might return { status: "ok", response: { ... } }
			// The SDK response structure might vary but usually has 'status' or 'type'.
			// Let's return the whole result.
			return NextResponse.json({ success: true, result });
		} else {
			return NextResponse.json({ error: result }, { status: 500 });
		}
	} catch (error: any) {
		console.error("Trade Error:", error);
		return NextResponse.json(
			{ error: error.message || "Trade Failed" },
			{ status: 500 },
		);
	}
}
