"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Loader2, Mic, MicOff, Send, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
	role: "user" | "assistant";
	content: string;
};

export function VoiceAgent() {
	const [isListening, setIsListening] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isMounted, setIsMounted] = useState(false);
	const [isVADActive, setIsVADActive] = useState(false);
	const [audioLevel, setAudioLevel] = useState(0);
	const [messages, setMessages] = useState<Message[]>([
		{
			role: "assistant",
			content:
				"こんにちは！暗号通貨の取引をお手伝いします。「開始」ボタンを押すと、話しかけるだけで自動的に認識が始まります。",
		},
	]);
	const [inputText, setInputText] = useState("");
	const [currentResponse, setCurrentResponse] = useState("");
	const recognitionRef = useRef<any>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);
	const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

	// Prevent hydration mismatch
	useEffect(() => {
		setIsMounted(true);
	}, []);

	useEffect(() => {
		if (!isMounted) return;

		if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
			// @ts-expect-error
			const recognition = new window.webkitSpeechRecognition();
			recognition.continuous = false;
			recognition.lang = "ja-JP";
			recognition.interimResults = false;

			recognition.onresult = (event: any) => {
				const text = event.results[0][0].transcript;
				handleSendMessage(text);
			};

			recognition.onend = () => {
				setIsListening(false);
			};

			recognitionRef.current = recognition;
		}
	}, [isMounted]);

	// Voice Activity Detection
	const startVAD = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			micStreamRef.current = stream;

			const audioContext = new AudioContext();
			audioContextRef.current = audioContext;

			const analyser = audioContext.createAnalyser();
			analyser.fftSize = 2048;
			analyser.smoothingTimeConstant = 0.8;
			analyserRef.current = analyser;

			const source = audioContext.createMediaStreamSource(stream);
			source.connect(analyser);

			setIsVADActive(true);
			monitorAudioLevel();
		} catch (error) {
			console.error("Microphone access denied:", error);
			alert("マイクへのアクセスが拒否されました。ブラウザの設定を確認してください。");
		}
	};

	const stopVAD = () => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
		}
		if (silenceTimerRef.current) {
			clearTimeout(silenceTimerRef.current);
		}
		if (micStreamRef.current) {
			micStreamRef.current.getTracks().forEach((track) => track.stop());
		}
		if (audioContextRef.current) {
			audioContextRef.current.close();
		}
		setIsVADActive(false);
		setAudioLevel(0);
	};

	const monitorAudioLevel = () => {
		if (!analyserRef.current) return;

		const analyser = analyserRef.current;
		const dataArray = new Uint8Array(analyser.frequencyBinCount);

		const checkLevel = () => {
			analyser.getByteFrequencyData(dataArray);

			// Calculate average volume
			const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
			setAudioLevel(average);

			// Threshold for voice detection (adjust as needed)
			const VOICE_THRESHOLD = 30;
			const SILENCE_DURATION = 1500; // 1.5 seconds of silence

			if (average > VOICE_THRESHOLD) {
				// Voice detected
				if (!isListening && !isLoading) {
					console.log("Voice detected, starting recognition...");
					recognitionRef.current?.start();
					setIsListening(true);
				}

				// Reset silence timer
				if (silenceTimerRef.current) {
					clearTimeout(silenceTimerRef.current);
					silenceTimerRef.current = null;
				}
			} else if (isListening) {
				// Start silence timer if not already started
				if (!silenceTimerRef.current) {
					silenceTimerRef.current = setTimeout(() => {
						console.log("Silence detected, stopping recognition...");
						recognitionRef.current?.stop();
						silenceTimerRef.current = null;
					}, SILENCE_DURATION);
				}
			}

			animationFrameRef.current = requestAnimationFrame(checkLevel);
		};

		checkLevel();
	};

	const toggleVAD = () => {
		if (isVADActive) {
			stopVAD();
		} else {
			startVAD();
		}
	};

	const handleSendMessage = async (text: string) => {
		if (!text.trim() || isLoading) return;

		const userMessage: Message = { role: "user", content: text };
		const newMessages = [...messages, userMessage];
		setMessages(newMessages);
		setInputText("");
		setIsLoading(true);
		setCurrentResponse("");

		try {
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: newMessages }),
			});

			if (!res.ok) throw new Error("API request failed");

			// Handle streaming response
			const reader = res.body?.getReader();
			const decoder = new TextDecoder();
			let fullText = "";

			if (reader) {
				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					fullText += chunk;
					setCurrentResponse(fullText);
				}

				// Add final message to history
				setMessages((prev) => [
					...prev,
					{ role: "assistant", content: fullText },
				]);
			}
		} catch (error) {
			console.error("Chat Error:", error);
			const errorMsg = "申し訳ございません。エラーが発生しました。";
			setCurrentResponse(errorMsg);
			setMessages((prev) => [
				...prev,
				{ role: "assistant", content: errorMsg },
			]);
		} finally {
			setIsLoading(false);
		}
	};

	const lastMessage = messages[messages.length - 1];

	return (
		<Card className="w-full h-[600px] flex flex-col glass border-2 border-white/10 shadow-2xl hover:border-white/20 transition-all duration-300 overflow-hidden">
			<CardHeader className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
				<CardTitle className="flex items-center gap-3 text-2xl">
					<div className="p-2 rounded-lg bg-white/10">
						<Volume2 className="w-6 h-6 text-white" />
					</div>
					<span className="text-white font-bold">Voice Assistant</span>
					<span className="ml-auto text-xs font-normal text-white/60">
						{isVADActive ? "自動音声検出 ON" : "音声検出 OFF"}
					</span>
				</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden">
				{/* Background Animation */}
				<div className="absolute inset-0 flex items-center justify-center opacity-10">
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className={`absolute rounded-full border-2 border-white ${
								isListening ? "animate-ping" : ""
							}`}
							style={{
								width: `${(i + 1) * 80}px`,
								height: `${(i + 1) * 80}px`,
								animationDelay: `${i * 0.2}s`,
								animationDuration: "2s",
							}}
						/>
					))}
				</div>

				{/* Main Voice Button */}
				<div className="relative z-10 flex flex-col items-center gap-8">
					{/* Large Mic Button */}
					<button
						onClick={toggleVAD}
						disabled={isLoading}
						className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 ${
							isVADActive
								? "bg-gradient-to-br from-green-500 to-green-600 shadow-[0_0_60px_rgba(34,197,94,0.6)] scale-110"
								: isLoading
									? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_0_40px_rgba(59,130,246,0.5)]"
									: "bg-gradient-to-br from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105"
						}`}
					>
						{isLoading ? (
							<Loader2 className="w-20 h-20 text-white animate-spin" />
						) : isVADActive ? (
							<>
								{isListening ? (
									<MicOff className="w-20 h-20 text-white animate-pulse" />
								) : (
									<Mic className="w-20 h-20 text-white" />
								)}
								{/* Audio Level Indicator */}
								<div
									className="absolute inset-0 rounded-full border-4 border-white/50 transition-all duration-100"
									style={{
										transform: `scale(${1 + audioLevel / 100})`,
										opacity: audioLevel / 100,
									}}
								/>
								{isListening && (
									<>
										<div className="absolute inset-0 rounded-full border-4 border-white/50 animate-ping" />
										<div
											className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping"
											style={{ animationDelay: "0.5s" }}
										/>
									</>
								)}
							</>
						) : (
							<Mic className="w-20 h-20 text-white" />
						)}
					</button>

					{/* Status Text */}
					<div className="text-center">
						<p className="text-2xl font-bold text-white mb-2">
							{isVADActive
								? isListening
									? "聞いています..."
									: "話しかけてください"
								: isLoading
									? "考え中..."
									: "タップして開始"}
						</p>
						<p className="text-sm text-white/60">
							{isVADActive
								? isListening
									? "マイクに向かって話してください"
									: "音声を検出すると自動的に認識開始"
								: isLoading
									? "AIが応答を生成しています"
									: "ボタンを押すと自動音声検出が始まります"}
						</p>
					</div>

					{/* Response Display */}
					{(lastMessage || currentResponse) && (
						<div className="w-full max-w-md">
							<div
								className={`p-6 rounded-2xl backdrop-blur-sm border-2 ${
									isLoading
										? "bg-white/5 border-white/10"
										: lastMessage?.role === "user"
											? "bg-white/10 border-white/20"
											: "bg-white/5 border-white/10"
								}`}
							>
								<div className="flex items-start gap-3 mb-2">
									{isLoading || lastMessage?.role === "assistant" ? (
										<Bot className="w-6 h-6 text-white flex-shrink-0 mt-1" />
									) : (
										<Mic className="w-6 h-6 text-white flex-shrink-0 mt-1" />
									)}
									<div className="flex-1">
										<p className="text-xs text-white/60 mb-1 font-semibold">
											{isLoading || lastMessage?.role === "assistant"
												? "AI Assistant"
												: "あなた"}
										</p>
										<p className="text-white text-lg leading-relaxed font-medium">
											{isLoading && currentResponse
												? currentResponse
												: lastMessage?.content}
											{isLoading && <span className="animate-pulse">▊</span>}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Manual Input (Collapsed) */}
				<div className="absolute bottom-6 left-6 right-6 z-10">
					<details className="group">
						<summary className="cursor-pointer text-white/40 hover:text-white/60 text-sm text-center mb-2 font-medium">
							テキスト入力
						</summary>
						<div className="flex gap-2 animate-[fadeIn_0.3s_ease-out]">
							<Input
								value={inputText}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
									setInputText(e.target.value)
								}
								placeholder="メッセージを入力..."
								onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
									e.key === "Enter" && handleSendMessage(inputText)
								}
								disabled={isLoading}
								className="border-2 border-white/20 focus:border-white/40 transition-colors text-base h-12 bg-white/5 text-white placeholder:text-white/40 font-medium"
							/>
							<Button
								size="icon"
								onClick={() => handleSendMessage(inputText)}
								disabled={isLoading || !inputText.trim()}
								className="bg-white/90 hover:bg-white transition-all h-12 w-12 text-gray-900"
							>
								{isLoading ? (
									<Loader2 className="h-5 w-5 animate-spin" />
								) : (
									<Send className="h-5 w-5" />
								)}
							</Button>
						</div>
					</details>
				</div>
			</CardContent>
		</Card>
	);
}
