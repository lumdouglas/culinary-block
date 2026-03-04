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
import { generatePermitPdf } from "@/lib/catering-permit-pdf";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Send, Download, Loader2 } from "lucide-react";

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

export function PermitWizard() {
  const [language, setLanguage] = useState<PermitLanguageCode>("en");
  const [permitData, setPermitData] = useState<CateringPermitData>(DEFAULT_PERMIT_DATA);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    const next = extractPermitUpdatesFromMessages(messages);
    setPermitData(next);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setSpeechSupported("webkitSpeechRecognition" in window);
  }, []);

  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const text = inputValue.trim();
      if (!text || isLoading) return;
      setInputValue("");
      sendMessage({ text });
    },
    [inputValue, isLoading, sendMessage]
  );

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
    onerror: () => void;
    start: () => void;
    stop: () => void;
  };
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const toggleMic = useCallback(() => {
    if (!speechSupported) return;
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
    rec.onresult = (event: { results: Iterable<{ 0: { transcript: string }; length: number }> }) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, [language, isListening, speechSupported]);

  const hasRequiredContact =
    permitData.catering_dba &&
    permitData.owner_name &&
    permitData.owner_phone &&
    permitData.owner_email;
  const hasMenu = permitData.menu_items.length > 0;
  const canDownload = hasRequiredContact && hasMenu;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Santa Clara County Catering Permit Assistant
        </h1>
        <p className="text-slate-600 mt-1">
          We’ll fill out your application step by step. Speak or type in your language.
        </p>
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
        <div className="lg:col-span-2 space-y-4">
          <div
            className={cn(
              "rounded-2xl border bg-white min-h-[320px] max-h-[480px] overflow-y-auto p-4 flex flex-col"
            )}
          >
            <div className="flex-1 space-y-4">
              {messages.length === 0 && (
                <p className="text-slate-500 text-sm">
                  Say or type something like: “My business is called Maria’s Kitchen and I’m the owner.”
                </p>
              )}
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
                        return <p key={i} className="whitespace-pre-wrap">{p.text}</p>;
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
            </div>
            <div ref={messagesEndRef} />
          </div>

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
            <Button type="submit" disabled={isLoading || !inputValue.trim()} data-testid="permit-chat-send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>

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

          <Button
            disabled={!canDownload}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            data-testid="permit-download-pdf"
            onClick={async () => {
              if (!canDownload) return;
              const bytes = await generatePermitPdf(permitData);
              const blob = new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "catering-permit-application.pdf";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download filled PDF
          </Button>
          <p className="text-xs text-slate-500">
            Complete the chat to collect all required fields, then download. Submit the PDF and $446 fee to the county. Culinary Block permit-assist service ($100) can be added at checkout when you book.
          </p>
        </div>
      </div>
    </div>
  );
}
