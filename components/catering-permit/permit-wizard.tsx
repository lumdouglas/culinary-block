"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEFAULT_PERMIT_DATA,
  mergePermitData,
  PERMIT_LANGUAGES,
  type CateringPermitData,
  type PermitLanguageCode,
  type UpdatePermitData,
} from "@/lib/catering-permit";
import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Send,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
} from "lucide-react";

// ─── constants ──────────────────────────────────────────────────────────────
const FORM_DATA_KEY = "permit-wizard-form-v1";
const STREAM_TIMEOUT_MS = 60_000;

// ─── helpers ────────────────────────────────────────────────────────────────
function extractPermitUpdatesFromMessages(
  messages: Array<{ id: string; role: string; parts?: Array<{ type: string; input?: unknown }> }>
): CateringPermitData {
  let data = DEFAULT_PERMIT_DATA;
  for (const msg of messages) {
    if (msg.role !== "assistant" || !msg.parts) continue;
    for (const part of msg.parts) {
      const p = part as { type: string; input?: UpdatePermitData };
      if (p.type === "tool-update_permit_data" && p.input) {
        data = mergePermitData(data, p.input);
      }
    }
  }
  return data;
}

function messagesHaveToolUpdates(
  messages: Array<{ role: string; parts?: Array<{ type: string }> }>
) {
  return messages.some(
    (m) =>
      m.role === "assistant" &&
      m.parts?.some((p) => p.type === "tool-update_permit_data")
  );
}

function loadSavedFormData(): CateringPermitData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FORM_DATA_KEY);
    return raw ? (JSON.parse(raw) as CateringPermitData) : null;
  } catch {
    return null;
  }
}

function saveFormData(data: CateringPermitData) {
  try {
    if (JSON.stringify(data) !== JSON.stringify(DEFAULT_PERMIT_DATA)) {
      localStorage.setItem(FORM_DATA_KEY, JSON.stringify(data));
    }
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function clearFormData() {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
  } catch {
    // ignore
  }
}

// ─── component ──────────────────────────────────────────────────────────────
export function PermitWizard() {
  const [language, setLanguage] = useState<PermitLanguageCode>("en");
  const [permitData, setPermitData] = useState<CateringPermitData>(DEFAULT_PERMIT_DATA);
  const [isListening, setIsListening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Error / feedback states
  const [chatError, setChatError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/catering-permit/chat",
        body: () => ({ language: languageRef.current }),
      }),
    []
  );

  // Destructure error + stop in addition to the existing fields.
  // "stop" aborts an in-flight stream; "error" surfaces API failures.
  const {
    messages,
    sendMessage,
    status,
    error: chatApiError,
    stop,
  } = useChat({ transport }) as {
    messages: Array<{ id: string; role: string; parts?: Array<{ type: string; text?: string; input?: unknown }> }>;
    sendMessage: (msg: { text: string }) => void;
    status: "idle" | "submitted" | "streaming" | "error";
    error?: Error;
    stop?: () => void;
  };

  const isLoading = status === "streaming" || status === "submitted";

  // Log chat status in production only so we can debug stalls without
  // interfering with dev HMR behavior.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    // #region agent log
    fetch("http://127.0.0.1:7533/ingest/483f0db5-e7b2-4169-b067-3108112155bc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "034496",
      },
      body: JSON.stringify({
        sessionId: "034496",
        runId: "pre-fix-2",
        hypothesisId: "D",
        location: "components/catering-permit/permit-wizard.tsx:status",
        message: "Permit wizard status update",
        data: { status, messagesLength: messages.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [status, messages.length]);

  // ── Derive permit data from AI tool calls ──────────────────────────────────
  useEffect(() => {
    const next = extractPermitUpdatesFromMessages(messages);
    setPermitData(next);
  }, [messages]);

  // ── Restore saved form data on first mount (no messages yet = fresh session) ──
  // Runs after the messages effect above, so it wins when messages are empty.
  // This avoids SSR hydration issues (we never read localStorage during SSR).
  useEffect(() => {
    if (messagesHaveToolUpdates(messages)) return; // AI data takes priority
    const saved = loadSavedFormData();
    if (saved) setPermitData(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only once on mount

  // ── Persist form data whenever it changes ─────────────────────────────────
  useEffect(() => {
    saveFormData(permitData);
  }, [permitData]);

  // ── Auto-scroll chat to bottom ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Detect browser speech support ─────────────────────────────────────────
  useEffect(() => {
    setSpeechSupported(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    );
  }, []);

  // ── Surface API errors from useChat ───────────────────────────────────────
  useEffect(() => {
    if (chatApiError) {
      const raw = chatApiError.message || "Something went wrong. Please try again.";
      const isQuota =
        raw.includes("quota") ||
        raw.includes("rate limit") ||
        raw.includes("RESOURCE_EXHAUSTED");
      setChatError(
        isQuota
          ? "The AI service has reached its rate limit. Please wait a minute and try again, or check your Google AI plan."
          : raw
      );
    }
  }, [chatApiError]);

  // ── Clear chat error when a new stream starts ─────────────────────────────
  useEffect(() => {
    if (status === "streaming") setChatError(null);
  }, [status]);

  // ── Streaming timeout: abort + show error if AI takes > 60 s ─────────────
  useEffect(() => {
    if (isLoading) {
      streamTimeoutRef.current = setTimeout(() => {
        stop?.();
        setChatError(
          "The AI is taking too long to respond. Please try sending your message again."
        );
      }, STREAM_TIMEOUT_MS);
    } else {
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    }
    return () => {
      if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };
  }, [isLoading, stop]);

  // ── Input state ───────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = inputValue.trim();
      if (!text || isLoading) return;
      setLastUserText(text);
      setChatError(null);
      setInputValue("");
      sendMessage({ text });
    },
    [inputValue, isLoading, sendMessage]
  );

  const handleRetry = useCallback(() => {
    if (!lastUserText || isLoading) return;
    setChatError(null);
    sendMessage({ text: lastUserText });
  }, [lastUserText, isLoading, sendMessage]);

  const handleStartOver = useCallback(() => {
    clearFormData();
    window.location.reload();
  }, []);

  // ── Voice input ───────────────────────────────────────────────────────────
  const langMap: Record<PermitLanguageCode, string> = {
    en: "en-US",
    es: "es-US",
    zh: "zh-CN",
    vi: "vi-VN",
  };

  type SpeechRecognitionInstance = {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: { results: Iterable<{ 0: { transcript: string }; length: number }> }) => void;
    onend: () => void;
    onerror: (event: { error: string }) => void;
    start: () => void;
    stop: () => void;
  };
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const toggleMic = useCallback(() => {
    if (!speechSupported) return;
    setMicError(null);

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const Win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognition = Win.SpeechRecognition ?? Win.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = langMap[language];

    rec.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setMicError(null);
    };

    rec.onend = () => setIsListening(false);

    rec.onerror = (event) => {
      setIsListening(false);
      const code = event.error;
      if (code === "not-allowed" || code === "permission-denied") {
        setMicError(
          "Microphone access was denied. Please allow microphone access in your browser settings and try again."
        );
      } else if (code === "no-speech") {
        setMicError("No speech was detected. Please try again or type your answer.");
      } else if (code === "network") {
        setMicError("Voice recognition requires an internet connection.");
      } else {
        setMicError("Voice input stopped unexpectedly. Please type your answer.");
      }
    };

    recognitionRef.current = rec;

    try {
      rec.start();
      setIsListening(true);
    } catch {
      setMicError("Could not start microphone. Please type your answer instead.");
    }
  }, [language, isListening, speechSupported]);

  // ── Derived: can the user download? What's missing? ───────────────────────
  const missingFields: string[] = [];
  if (!permitData.catering_dba) missingFields.push("business name");
  if (!permitData.owner_name) missingFields.push("owner name");
  if (!permitData.owner_phone) missingFields.push("phone number");
  if (!permitData.owner_email) missingFields.push("email address");
  if (permitData.menu_items.length === 0) missingFields.push("at least one menu item");

  const canDownload = missingFields.length === 0;
  const hasAnyData =
    JSON.stringify(permitData) !== JSON.stringify(DEFAULT_PERMIT_DATA);

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Santa Clara County Catering Permit Assistant
            </h1>
            <p className="text-slate-600 mt-1">
              We&apos;ll fill out your application step by step. Speak or type in your language.
            </p>
          </div>
          {(messages.length > 0 || hasAnyData) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-slate-400 hover:text-red-500 flex items-center gap-1.5 shrink-0 mt-1"
              title="Clear session and start over"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Start over
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Label className="text-slate-700 font-medium">Language:</Label>
          <div className="flex gap-2">
            {PERMIT_LANGUAGES.map(({ code, label }) => (
              <Button
                key={code}
                type="button"
                variant={language === code ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage(code)}
                data-testid={`lang-${code}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat area */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-2xl border bg-white min-h-[320px] max-h-[480px] overflow-y-auto p-4 flex flex-col">
            <div className="flex-1 space-y-4">

              {/* Welcome message — shown only before first exchange */}
              {messages.length === 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm bg-slate-100 text-slate-900 space-y-2">
                    <p className="font-semibold">
                      👋 Welcome to the Culinary Block Permit Assistant!
                    </p>
                    <p>
                      I&apos;ll guide you through the Santa Clara County DEH catering
                      permit application — step by step, in about 10–15 minutes.
                    </p>
                    <p>
                      To start:{" "}
                      <strong>What is the name of your catering business?</strong>{" "}
                      (This is your DBA — &quot;Doing Business As&quot; — name.)
                    </p>
                    <p className="text-slate-500 text-xs flex items-center gap-1">
                      <ChevronDown className="h-3 w-3" />
                      Type below, or tap the mic to speak
                    </p>
                  </div>
                </div>
              )}

              {/* Chat messages */}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                      m.role === "user"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    )}
                  >
                    {m.parts?.map((part, i) => {
                      const p = part as { type: string; text?: string };
                      if (p.type === "text" && p.text) {
                        return (
                          <p key={i} className="whitespace-pre-wrap">
                            {p.text}
                          </p>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-2xl px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  </div>
                </div>
              )}

              {/* Error message with retry */}
              {chatError && !isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{chatError}</span>
                    </div>
                    {lastUserText && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRetry}
                        className="border-red-300 text-red-700 hover:bg-red-100 h-7 flex items-center gap-1.5"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Try again
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Mic error banner */}
          {micError && (
            <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{micError}</span>
            </div>
          )}

          {/* Input row */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            {speechSupported && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleMic}
                className={cn(isListening && "bg-red-100 border-red-300")}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
                data-testid="speech-toggle"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-600" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type or speak your answer..."
              className="flex-1"
              disabled={isLoading}
              data-testid="permit-chat-input"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              data-testid="permit-chat-send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Sidebar: form summary + download */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900 mb-3">Your application so far</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Catering name (DBA)</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.catering_dba || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Owner</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.owner_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Phone / Email</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.owner_phone || "—"} / {permitData.owner_email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Menu items</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.menu_items.length > 0
                    ? permitData.menu_items.map((i) => i.food).join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Host facility</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.pff_name}, {permitData.pff_address}
                </dd>
              </div>
            </dl>
          </div>

          {/* Download button */}
          <Button
            disabled={!canDownload || isDownloading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
            data-testid="permit-download-pdf"
            onClick={async () => {
              if (!canDownload) return;
              setDownloadError(null);
              setIsDownloading(true);
              try {
                const { generatePermitPdf } = await import(
                  "@/lib/catering-permit-pdf"
                );
                const bytes = await generatePermitPdf(permitData);
                const blob = new Blob([bytes.buffer as ArrayBuffer], {
                  type: "application/pdf",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "catering-permit-application.pdf";
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                setDownloadError(
                  err instanceof Error
                    ? `PDF error: ${err.message}`
                    : "Could not generate the PDF. Please try again."
                );
              } finally {
                setIsDownloading(false);
              }
            }}
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download filled PDF
          </Button>

          {/* Missing fields hint — shown when button is disabled */}
          {!canDownload && missingFields.length > 0 && (
            <div className="text-xs text-slate-500 bg-slate-100 rounded-xl px-3 py-2 space-y-1">
              <p className="font-medium text-slate-600">Still needed:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {missingFields.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Download error */}
          {downloadError && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Complete the chat to collect all required fields, then download. Submit
            the PDF and $446 fee to the county. Culinary Block permit-assist service
            ($100) can be added at checkout when you book.
          </p>
        </div>
      </div>
    </div>
  );
}
