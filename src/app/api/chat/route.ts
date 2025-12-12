import type { NextRequest } from "next/server";
import { cryptoBotAgent } from "@/mastra/agent";

export async function POST(req: NextRequest) {
	try {
		const { messages } = await req.json();

		const result = await cryptoBotAgent.stream(messages);

		// Create a readable stream
		const encoder = new TextEncoder();
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of result.textStream) {
						controller.enqueue(encoder.encode(chunk));
					}
					controller.close();
				} catch (error) {
					controller.error(error);
				}
			},
		});

		return new Response(stream, {
			headers: {
				"Content-Type": "text/plain; charset=utf-8",
				"Transfer-Encoding": "chunked",
			},
		});
	} catch (error: any) {
		console.error("Chat API Error:", error);
		return new Response(
			JSON.stringify({ error: error.message || "Failed to generate response" }),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
