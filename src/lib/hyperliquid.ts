import { ExchangeClient, HttpTransport, InfoClient } from "@nktkas/hyperliquid";
import { ethers } from "ethers";

export async function executeTrade(symbol: string, action: string) {
	const privateKey = process.env.PRIVATE_KEY;

	if (!privateKey) {
		throw new Error("PRIVATE_KEY not set in .env");
	}

	const wallet = new ethers.Wallet(privateKey);
	const transport = new HttpTransport({ isTestnet: true });

	const infoClient = new InfoClient({ transport });
	const exchangeClient = new ExchangeClient({ wallet, transport });

	const meta = await infoClient.meta();
	const coin = symbol.toUpperCase();
	const assetIndex = meta.universe.findIndex((u: any) => u.name === coin);

	if (assetIndex === -1) {
		throw new Error(`Symbol ${coin} not found`);
	}

	const isBuy = action.toLowerCase() === "buy";
	const sz = coin === "BTC" || coin === "ETH" ? 0.01 : 1;
	const limitPx = isBuy ? "100000" : "0.1";

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

	return result;
}
