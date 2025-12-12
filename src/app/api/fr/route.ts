import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
	try {
		const res = await fetch("https://api.hyperliquid-testnet.xyz/info", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ type: "metaAndAssetCtxs" }),
			cache: "no-store",
		});

		if (!res.ok) {
			console.error("Hyperliquid API error:", res.status, res.statusText);
			return NextResponse.json(
				{ error: `Hyperliquid API returned ${res.status}` },
				{ status: res.status },
			);
		}

		const data = await res.json();
		return NextResponse.json(data, {
			headers: {
				"Cache-Control": "no-store, max-age=0",
			},
		});
	} catch (error: any) {
		console.error("FR API Error:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to fetch FR data" },
			{ status: 500 },
		);
	}
}
