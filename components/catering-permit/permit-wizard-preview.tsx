"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  List,
} from "lucide-react";

// ─── constants ──────────────────────────────────────────────────────────────
const FORM_DATA_KEY = "permit-preview-form-v1";
const SESSION_DATA_KEY = "permit-preview-session-v1";
const MESSAGES_DATA_KEY = "permit-preview-messages-v1";
const STREAM_TIMEOUT_MS = 60_000;
const PDF_DEBOUNCE_MS = 1500;

type SessionData = {
  sessionId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  consent: boolean;
};

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

function loadSaved<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function saveTo(key: string, data: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearAll() {
  try {
    localStorage.removeItem(FORM_DATA_KEY);
    localStorage.removeItem(SESSION_DATA_KEY);
    localStorage.removeItem(MESSAGES_DATA_KEY);
  } catch {
    // ignore
  }
}

// ── Simple inline markdown renderer (bold, italic, line breaks) ──────────────
function renderMarkdown(text: string): React.ReactNode[] {
  return text.split("\n").flatMap((line, li, lines) => {
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={`${li}-b-${match.index}`}>{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={`${li}-i-${match.index}`}>{match[3]}</em>);
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    if (li < lines.length - 1) {
      parts.push(<br key={`br-${li}`} />);
    }
    return parts;
  });
}

// ── Voice input language mapping ─────────────────────────────────────────
const langMap: Record<PermitLanguageCode, string> = {
  en: "en-US",
  es: "es-US",
  zh: "zh-CN",
  vi: "vi-VN",
};

// ─── PDF Preview Hook ───────────────────────────────────────────────────────
function usePdfPreview(permitData: CateringPermitData) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Don't generate if we have no meaningful data
    const hasData = permitData.catering_dba || permitData.owner_name || permitData.menu_items.length > 0;
    if (!hasData) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsGenerating(true);
      try {
        const { generatePermitPdf } = await import("@/lib/catering-permit-pdf");
        const bytes = await generatePermitPdf(permitData);
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        // Revoke previous URL to avoid memory leaks
        if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
        prevUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        console.error("PDF preview generation failed:", err);
      } finally {
        setIsGenerating(false);
      }
    }, PDF_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [permitData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevUrlRef.current) URL.revokeObjectURL(prevUrlRef.current);
    };
  }, []);

  return { pdfUrl, isGenerating };
}

// ─── component ──────────────────────────────────────────────────────────────
export function PermitWizardWithPreview() {
  const [language, setLanguage] = useState<PermitLanguageCode>("en");
  const [permitData, setPermitData] = useState<CateringPermitData>(DEFAULT_PERMIT_DATA);
  const [isListening, setIsListening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"preview" | "summary">("preview");

  // Session / Intake State
  const [session, setSession] = useState<SessionData | null>(null);
  const [intakeForm, setIntakeForm] = useState<Omit<SessionData, "sessionId">>({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    consent: false,
  });

  // Error / feedback states
  const [chatError, setChatError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [lastUserText, setLastUserText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const languageRef = useRef(language);
  languageRef.current = language;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // PDF preview
  const { pdfUrl, isGenerating: isPdfGenerating } = usePdfPreview(permitData);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/catering-permit/chat",
        body: () => ({
          language: languageRef.current,
          sessionId: sessionRef.current?.sessionId,
          sessionData: sessionRef.current,
        }),
      }),
    []
  );

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    error: chatApiError,
    stop,
  } = useChat({ transport }) as {
    messages: Array<{ id: string; role: string; parts?: Array<{ type: string; text?: string; input?: unknown }> }>;
    setMessages: (messages: any[]) => void;
    sendMessage: (msg: { text: string }) => void;
    status: "idle" | "submitted" | "streaming" | "error";
    error?: Error;
    stop?: () => void;
  };

  const isLoading = status === "streaming" || status === "submitted";

  // ── Derive permit data from AI tool calls ──
  useEffect(() => {
    const next = extractPermitUpdatesFromMessages(messages);
    if (sessionRef.current) {
      if (!next.catering_dba && sessionRef.current.businessName) next.catering_dba = sessionRef.current.businessName;
      if (!next.owner_name && sessionRef.current.ownerName) next.owner_name = sessionRef.current.ownerName;
      if (!next.owner_email && sessionRef.current.email) next.owner_email = sessionRef.current.email;
      if (!next.owner_phone && sessionRef.current.phone) next.owner_phone = sessionRef.current.phone;
    }
    setPermitData(next);
  }, [messages]);

  // ── Restore saved data on mount ──
  useEffect(() => {
    const savedMessages = loadSaved<any[]>(MESSAGES_DATA_KEY);
    if (savedMessages && savedMessages.length > 0 && messages.length === 0) {
      setMessages(savedMessages);
    }
    const savedSession = loadSaved<SessionData>(SESSION_DATA_KEY);
    if (savedSession) setSession(savedSession);

    if (messagesHaveToolUpdates(messages) || (savedMessages && messagesHaveToolUpdates(savedMessages))) return;
    const saved = loadSaved<CateringPermitData>(FORM_DATA_KEY);
    if (saved) {
      setPermitData(saved);
      if (savedSession) {
        if (!saved.catering_dba) saved.catering_dba = savedSession.businessName;
        if (!saved.owner_name) saved.owner_name = savedSession.ownerName;
        if (!saved.owner_email) saved.owner_email = savedSession.email;
        if (!saved.owner_phone) saved.owner_phone = savedSession.phone;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persist ──
  useEffect(() => {
    if (JSON.stringify(permitData) !== JSON.stringify(DEFAULT_PERMIT_DATA)) {
      saveTo(FORM_DATA_KEY, permitData);
    }
  }, [permitData]);
  useEffect(() => {
    if (messages.length > 0) saveTo(MESSAGES_DATA_KEY, messages);
  }, [messages]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Speech support ──
  useEffect(() => {
    setSpeechSupported("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  }, []);

  // ── API errors ──
  useEffect(() => {
    if (chatApiError) {
      const raw = chatApiError.message || "Something went wrong. Please try again.";
      const isQuota = raw.includes("quota") || raw.includes("rate limit") || raw.includes("RESOURCE_EXHAUSTED");
      setChatError(isQuota ? "Rate limit reached. Please wait a minute and try again." : raw);
    }
  }, [chatApiError]);

  useEffect(() => {
    if (status === "streaming") setChatError(null);
  }, [status]);

  // ── Stream timeout ──
  useEffect(() => {
    if (isLoading) {
      streamTimeoutRef.current = setTimeout(() => {
        stop?.();
        setChatError("The AI is taking too long. Please try again.");
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

  // ── Input ──
  const [inputValue, setInputValue] = useState("");

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.businessName || !intakeForm.ownerName || !intakeForm.email || !intakeForm.phone || !intakeForm.consent) return;
    const newSession = { sessionId: crypto.randomUUID(), ...intakeForm };
    setSession(newSession);
    saveTo(SESSION_DATA_KEY, newSession);
    setPermitData((prev) => ({
      ...prev,
      catering_dba: newSession.businessName,
      owner_name: newSession.ownerName,
      owner_email: newSession.email,
      owner_phone: newSession.phone,
    }));
  };

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
    clearAll();
    window.location.reload();
  }, []);

  // ── Voice input ──
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
        setMicError("Microphone access denied. Check browser settings.");
      } else if (code === "no-speech") {
        setMicError("No speech detected. Try again or type your answer.");
      } else {
        setMicError("Voice input stopped. Please type instead.");
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
      setIsListening(true);
    } catch {
      setMicError("Could not start microphone. Please type instead.");
    }
  }, [language, isListening, speechSupported]);

  // ── Derived ──
  const missingFields: string[] = [];
  if (!permitData.catering_dba) missingFields.push("business name");
  if (!permitData.owner_name) missingFields.push("owner name");
  if (!permitData.owner_phone) missingFields.push("phone number");
  if (!permitData.owner_email) missingFields.push("email address");
  if (permitData.menu_items.length === 0) missingFields.push("at least one menu item");

  const canDownload = missingFields.length === 0;
  const hasAnyData = JSON.stringify(permitData) !== JSON.stringify(DEFAULT_PERMIT_DATA);

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Santa Clara County Catering Permit Assistant
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Fill out your application step by step. See the PDF update live as you go.
              <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">
                Free trial
              </span>
            </p>
          </div>
          {(messages.length > 0 || hasAnyData) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleStartOver}
              className="text-slate-400 hover:text-red-500 flex items-center gap-1.5 shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Start over
            </Button>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Label className="text-slate-700 font-medium text-sm">Language:</Label>
          <div className="flex gap-1.5">
            {PERMIT_LANGUAGES.map(({ code, label }) => (
              <Button
                key={code}
                type="button"
                variant={language === code ? "default" : "outline"}
                size="sm"
                onClick={() => setLanguage(code)}
                className="h-7 text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main layout: Chat + PDF Preview side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: "calc(100vh - 180px)" }}>
        {/* Left: Chat */}
        <div className="flex flex-col min-h-0">
          {!session ? (
            // Intake Form
            <div className="rounded-2xl border bg-white p-8 flex-1">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold text-slate-900 mb-2">Let&apos;s get started</h2>
                <p className="text-slate-500 text-sm mb-6">Basic info to set up your permit file.</p>

                <form onSubmit={handleIntakeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name (DBA) <span className="text-red-500">*</span></Label>
                    <Input id="businessName" required value={intakeForm.businessName} onChange={(e) => setIntakeForm((p) => ({ ...p, businessName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Full Name <span className="text-red-500">*</span></Label>
                    <Input id="ownerName" required value={intakeForm.ownerName} onChange={(e) => setIntakeForm((p) => ({ ...p, ownerName: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                    <Input id="email" type="email" required value={intakeForm.email} onChange={(e) => setIntakeForm((p) => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone <span className="text-red-500">*</span></Label>
                    <Input id="phone" type="tel" required value={intakeForm.phone} onChange={(e) => setIntakeForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="flex items-start space-x-3 pt-4 pb-2">
                    <Checkbox
                      id="consent"
                      checked={intakeForm.consent}
                      onCheckedChange={(checked) => setIntakeForm((p) => ({ ...p, consent: checked as boolean }))}
                    />
                    <label htmlFor="consent" className="text-sm text-slate-500 leading-tight cursor-pointer">
                      I understand my chat data may be saved to improve the AI assistant. <span className="text-red-500">*</span>
                    </label>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!intakeForm.businessName || !intakeForm.ownerName || !intakeForm.email || !intakeForm.phone || !intakeForm.consent}
                  >
                    Start Chat
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            // Chat
            <div className="rounded-2xl border bg-white flex flex-col overflow-hidden flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Welcome */}
                {messages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm bg-slate-100 text-slate-900 space-y-2">
                      <p className="font-semibold">Welcome! I&apos;ll help you fill out your DEH catering permit.</p>
                      <p>Want to start with the basics (address, business info) or jump to the menu and food safety questions?</p>
                      <p className="text-slate-500 text-xs flex items-center gap-1">
                        <ChevronDown className="h-3 w-3" /> Type or tap the mic
                      </p>
                    </div>
                  </div>
                )}

                {messages.map((m) => (
                  <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                        m.role === "user" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-900"
                      )}
                    >
                      {m.parts?.map((part, i) => {
                        const p = part as { type: string; text?: string };
                        if (p.type === "text" && p.text) {
                          return <p key={i} className="whitespace-pre-wrap">{renderMarkdown(p.text)}</p>;
                        }
                        return null;
                      })}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl px-4 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    </div>
                  </div>
                )}

                {chatError && !isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-red-50 border border-red-200 text-red-800 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>{chatError}</span>
                      </div>
                      {lastUserText && (
                        <Button type="button" size="sm" variant="outline" onClick={handleRetry} className="border-red-300 text-red-700 hover:bg-red-100 h-7 flex items-center gap-1.5">
                          <RefreshCw className="h-3 w-3" /> Try again
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4 shrink-0" />
              </div>

              {/* Input area */}
              <div className="p-3 pt-2 bg-white border-t border-slate-100 flex flex-col shrink-0 gap-2">
                {micError && (
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{micError}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex items-end gap-2 m-0">
                  {speechSupported && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={toggleMic}
                      className={cn(isListening && "bg-red-100 border-red-300", "mb-[2px]")}
                    >
                      {isListening ? <MicOff className="h-4 w-4 text-red-600" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  )}
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type or speak your answer..."
                    className="flex-1 min-h-[52px] resize-y text-sm"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button type="submit" disabled={isLoading || !inputValue.trim()} className="mb-[2px]">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right: PDF Preview + Summary toggle */}
        <div className="flex flex-col min-h-0">
          {/* Tab bar */}
          <div className="flex items-center gap-1 mb-2">
            <Button
              type="button"
              variant={sidebarTab === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setSidebarTab("preview")}
              className="h-8 text-xs gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              PDF Preview
              {isPdfGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
            </Button>
            <Button
              type="button"
              variant={sidebarTab === "summary" ? "default" : "outline"}
              size="sm"
              onClick={() => setSidebarTab("summary")}
              className="h-8 text-xs gap-1.5"
            >
              <List className="h-3.5 w-3.5" />
              Data Summary
            </Button>

            <div className="ml-auto">
              <Button
                disabled={!canDownload || isDownloading}
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 gap-1.5"
                onClick={async () => {
                  if (!canDownload) return;
                  setDownloadError(null);
                  setIsDownloading(true);
                  try {
                    const { generatePermitPdf } = await import("@/lib/catering-permit-pdf");
                    const bytes = await generatePermitPdf(permitData);
                    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "catering-permit-application.pdf";
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (err) {
                    setDownloadError(err instanceof Error ? `PDF error: ${err.message}` : "Could not generate the PDF.");
                  } finally {
                    setIsDownloading(false);
                  }
                }}
              >
                {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Download PDF
              </Button>
            </div>
          </div>

          {/* Content area */}
          {sidebarTab === "preview" ? (
            <div className="rounded-2xl border bg-white flex-1 min-h-0 overflow-hidden relative">
              {pdfUrl ? (
                <iframe
                  src={`${pdfUrl}#navpanes=0`}
                  className="w-full h-full border-0"
                  title="Permit PDF Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  <div className="text-center space-y-2">
                    <FileText className="h-12 w-12 mx-auto opacity-30" />
                    <p>PDF preview will appear here as you fill in the application</p>
                  </div>
                </div>
              )}
              {isPdfGenerating && (
                <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs text-slate-500 flex items-center gap-1.5 shadow-sm">
                  <Loader2 className="h-3 w-3 animate-spin" /> Updating...
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border bg-slate-50 p-4 flex-1 overflow-y-auto">
              <h2 className="font-semibold text-slate-900 mb-3 text-sm">Application Data</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Business (DBA)</dt>
                  <dd className="font-medium text-slate-900">{permitData.catering_dba || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Owner</dt>
                  <dd className="font-medium text-slate-900">{permitData.owner_name || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Phone / Email</dt>
                  <dd className="font-medium text-slate-900">{permitData.owner_phone || "—"} / {permitData.owner_email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Address</dt>
                  <dd className="font-medium text-slate-900">
                    {permitData.owner_address ? `${permitData.owner_address}, ${permitData.owner_city} ${permitData.owner_state} ${permitData.owner_zip}` : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Menu items ({permitData.menu_items.length})</dt>
                  <dd className="font-medium text-slate-900">
                    {permitData.menu_items.length > 0 ? permitData.menu_items.map((i) => i.food).join(", ") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Delivery method</dt>
                  <dd className="font-medium text-slate-900">{permitData.delivery_method || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Sanitize method</dt>
                  <dd className="font-medium text-slate-900">{permitData.sanitize_method || "—"}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Host facilities</dt>
                  <dd className="font-medium text-slate-900">
                    {permitData.host_facilities.length > 0 ? permitData.host_facilities.map((h) => h.name).join(", ") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">PFF</dt>
                  <dd className="font-medium text-slate-900">{permitData.pff_name}, {permitData.pff_address}</dd>
                </div>
              </dl>

              {!canDownload && missingFields.length > 0 && (
                <div className="mt-4 text-xs text-slate-500 bg-slate-100 rounded-xl px-3 py-2 space-y-1">
                  <p className="font-medium text-slate-600">Still needed:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {missingFields.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {downloadError && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{downloadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
