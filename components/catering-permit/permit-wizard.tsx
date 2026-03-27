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
import { notifyPermitSession } from "@/app/actions/permit";
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
const SESSION_DATA_KEY = "permit-wizard-session-v1";
const MESSAGES_DATA_KEY = "permit-wizard-messages-v1";
const STREAM_TIMEOUT_MS = 60_000;

type SessionData = {
  sessionId: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  consent: boolean;
};

const UI_TRANSLATIONS = {
  en: {
    title: "Santa Clara County Catering Permit Assistant",
    subtitle: "We'll fill out your application step by step. Speak or type in your language.",
    pricingTrial: "The service fee will be $100, but is currently in free trial.",
    startOver: "Start over",
    languageLabel: "Language:",
    welcomeGreeting: "👋 Welcome to the Culinary Block Permit Assistant!",
    welcomeIntro: "I'll help you with the Santa Clara County DEH catering permit application.",
    welcomeQuestion: "Before we begin: What do you want to focus on today? We can start with the basics (business name, address), or jump straight to the tricky parts (menu items, safety procedures, transport). Which would you prefer?",
    typeOrSpeak: "Type below, or tap the mic to speak",
    appSoFar: "Your application so far",
    fieldDba: "Catering name (DBA)",
    fieldOwner: "Owner",
    fieldPhoneEmail: "Phone / Email",
    fieldMenu: "Menu items",
    fieldHost: "Host facility",
    downloadBtn: "Download filled PDF",
    stillNeeded: "Still needed:",
    footerNote: "Complete the chat to collect all required fields, then download. Submit the PDF and $446 fee to the county.",
    placeholder: "Type or speak your answer...",
    missingDba: "business name",
    missingOwner: "owner name",
    missingPhone: "phone number",
    missingEmail: "email address",
    missingMenu: "at least one menu item",
    intakeTitle: "Let's get started",
    intakeSubtitle: "Please provide your basic information so we can set up your permit application file.",
    intakeBusinessName: "Business Name (DBA)",
    intakeOwnerName: "Owner Full Name",
    intakeEmail: "Email Address",
    intakePhone: "Phone Number",
    intakeConsent: "I understand that my permit application chat data may be saved and used to improve the performance of the AI permit assistant.",
    intakeStartChat: "Start Chat"
  },
  es: {
    title: "Asistente de Permisos de Catering del Condado de Santa Clara",
    subtitle: "Completaremos su solicitud paso a paso. Hable o escriba en su idioma.",
    pricingTrial: "La tarifa de servicio será de $100, pero actualmente está en prueba gratuita.",
    startOver: "Empezar de nuevo",
    languageLabel: "Idioma:",
    welcomeGreeting: "👋 ¡Bienvenido al Asistente de Permisos de Culinary Block!",
    welcomeIntro: "Le ayudaré con la solicitud del permiso de catering del DEH del Condado de Santa Clara.",
    welcomeQuestion: "Antes de comenzar: ¿En qué desea enfocarse hoy? Podemos empezar con lo básico (nombre del negocio, dirección), o pasar directamente a las partes difíciles (elementos del menú, procedimientos de seguridad, transporte). ¿Qué prefiere?",
    typeOrSpeak: "Escriba abajo, o toque el micrófono para hablar",
    appSoFar: "Su solicitud hasta ahora",
    fieldDba: "Nombre del catering (DBA)",
    fieldOwner: "Propietario",
    fieldPhoneEmail: "Teléfono / Correo electrónico",
    fieldMenu: "Elementos del menú",
    fieldHost: "Instalación anfitriona",
    downloadBtn: "Descargar PDF rellenado",
    stillNeeded: "Aún se necesita:",
    footerNote: "Complete el chat para recopilar todos los campos necesarios y luego descárguelo. Envie el PDF y la tarifa de $446 al condado.",
    placeholder: "Escriba o hable su respuesta...",
    missingDba: "nombre del negocio",
    missingOwner: "nombre del propietario",
    missingPhone: "número de teléfono",
    missingEmail: "correo electrónico",
    missingMenu: "al menos un elemento del menú",
    intakeTitle: "Empecemos",
    intakeSubtitle: "Por favor, proporcione su información básica para que podamos configurar su archivo de solicitud de permiso.",
    intakeBusinessName: "Nombre del Negocio (DBA)",
    intakeOwnerName: "Nombre Completo del Propietario",
    intakeEmail: "Correo Electrónico",
    intakePhone: "Número de Teléfono",
    intakeConsent: "Entiendo que los datos de mi chat de solicitud de permiso pueden ser guardados y utilizados para mejorar el rendimiento del asistente de permisos de IA.",
    intakeStartChat: "Iniciar Chat"
  },
  zh: {
    title: "圣克拉拉县餐饮许可证助手",
    subtitle: "我们将逐步填写您的申请。请使用您的语言说话或打字。",
    pricingTrial: "服务费为 100 美元，但目前处于免费试用期。",
    startOver: "重新开始",
    languageLabel: "语言:",
    welcomeGreeting: "👋 欢迎使用 Culinary Block 许可证助手！",
    welcomeIntro: "我将帮助您完成圣克拉拉县 DEH 餐饮许可证申请。",
    welcomeQuestion: "在开始之前：您今天想重点关注什么？我们可以从基本信息（公司名称、地址）开始，或者直接进入复杂部分（菜单项、安全程序、运输）。您更喜欢哪一个？",
    typeOrSpeak: "在下方输入，或点击麦克风说话",
    appSoFar: "您目前的申请",
    fieldDba: "餐饮名称 (DBA)",
    fieldOwner: "所有者",
    fieldPhoneEmail: "电话 / 电子邮件",
    fieldMenu: "菜单项目",
    fieldHost: "东道主设施",
    downloadBtn: "下载填好的 PDF",
    stillNeeded: "仍然需要:",
    footerNote: "完成聊天以收集所有必填字段，然后下载。将 PDF 和 446 美元的费用提交给县政府。",
    placeholder: "输入或说出您的答案...",
    missingDba: "公司名称",
    missingOwner: "所有者姓名",
    missingPhone: "电话号码",
    missingEmail: "电子邮件地址",
    missingMenu: "至少有一个菜单项目",
    intakeTitle: "我们开始吧",
    intakeSubtitle: "请提供您的基本信息，以便我们设置您的许可证申请文件。",
    intakeBusinessName: "公司名称 (DBA)",
    intakeOwnerName: "所有者全名",
    intakeEmail: "电子邮件地址",
    intakePhone: "电话号码",
    intakeConsent: "我了解我的许可证申请聊天数据可能会被保存并用于改善 AI 许可证助手的性能。",
    intakeStartChat: "开始聊天"
  },
  vi: {
    title: "Trợ lý Giấy phép Dịch vụ Ăn uống Quận Santa Clara",
    subtitle: "Chúng tôi sẽ điền đơn đăng ký của bạn từng bước một. Nói hoặc nhập bằng ngôn ngữ của bạn.",
    pricingTrial: "Phí dịch vụ sẽ là $100 nhưng hiện đang được dùng thử miễn phí.",
    startOver: "Bắt đầu lại",
    languageLabel: "Ngôn ngữ:",
    welcomeGreeting: "👋 Chào mừng đến với Trợ lý Giấy phép Culinary Block!",
    welcomeIntro: "Tôi sẽ giúp bạn với đơn xin giấy phép dịch vụ ăn uống của DEH Quận Santa Clara.",
    welcomeQuestion: "Trước khi chúng ta bắt đầu: Hôm nay bạn muốn tập trung vào điều gì? Chúng ta có thể bắt đầu với những thông tin cơ bản (tên doanh nghiệp, địa chỉ), hoặc đi thẳng vào những phần phức tạp (thực đơn, quy trình an toàn, vận chuyển). Bạn thích điều nào hơn?",
    typeOrSpeak: "Nhập vào bên dưới, hoặc nhấn vào micrô để nói",
    appSoFar: "Đơn đăng ký của bạn cho đến nay",
    fieldDba: "Tên dịch vụ ăn uống (DBA)",
    fieldOwner: "Chủ sở hữu",
    fieldPhoneEmail: "Điện thoại / Email",
    fieldMenu: "Thực đơn",
    fieldHost: "Cơ sở lưu trữ",
    downloadBtn: "Tải xuống PDF đã điền",
    stillNeeded: "Vẫn cần:",
    footerNote: "Hoàn thành cuộc trò chuyện để thu thập tất cả các trường bắt buộc, sau đó tải xuống. Nộp bản PDF và khoản phí $446 cho quận.",
    placeholder: "Nhập hoặc nói câu trả lời của bạn...",
    missingDba: "tên doanh nghiệp",
    missingOwner: "tên chủ sở hữu",
    missingPhone: "số điện thoại",
    missingEmail: "địa chỉ email",
    missingMenu: "ít nhất một mục thực đơn",
    intakeTitle: "Hãy bắt đầu",
    intakeSubtitle: "Vui lòng cung cấp thông tin cơ bản của bạn để chúng tôi có thể thiết lập hồ sơ xin giấy phép của bạn.",
    intakeBusinessName: "Tên Doanh nghiệp (DBA)",
    intakeOwnerName: "Họ và Tên Chủ sở hữu",
    intakeEmail: "Địa chỉ Email",
    intakePhone: "Số điện thoại",
    intakeConsent: "Tôi hiểu rằng dữ liệu trò chuyện xin giấy phép của tôi có thể được lưu lại và sử dụng để cải thiện hiệu suất của trợ lý giấy phép AI.",
    intakeStartChat: "Bắt đầu Trò chuyện"
  }
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
    localStorage.removeItem(SESSION_DATA_KEY);
    localStorage.removeItem(MESSAGES_DATA_KEY);
  } catch {
    // ignore
  }
}

function loadSavedMessages(): any[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MESSAGES_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMessages(messages: any[]) {
  try {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_DATA_KEY, JSON.stringify(messages));
    }
  } catch {
    // ignore
  }
}

function loadSavedSessionData(): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_DATA_KEY);
    return raw ? (JSON.parse(raw) as SessionData) : null;
  } catch {
    return null;
  }
}

function saveSessionData(data: SessionData) {
  try {
    localStorage.setItem(SESSION_DATA_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ── Voice input language mapping ─────────────────────────────────────────────────
const langMap: Record<PermitLanguageCode, string> = {
  en: "en-US",
  es: "es-US",
  zh: "zh-CN",
  vi: "vi-VN",
};

// ─── component ──────────────────────────────────────────────────────────────
export function PermitWizard() {
  const [language, setLanguage] = useState<PermitLanguageCode>("en");
  const [permitData, setPermitData] = useState<CateringPermitData>(DEFAULT_PERMIT_DATA);
  const [isListening, setIsListening] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Session / Intake State
  const [session, setSession] = useState<SessionData | null>(null);
  const [intakeForm, setIntakeForm] = useState<Omit<SessionData, "sessionId">>({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    consent: false
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

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/catering-permit/chat",
        body: () => ({ 
          language: languageRef.current,
          sessionId: sessionRef.current?.sessionId,
          sessionData: sessionRef.current
        }),
      }),
    []
  );

  // Destructure error + stop in addition to the existing fields.
  // "stop" aborts an in-flight stream; "error" surfaces API failures.
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
    }).catch(() => { });
    // #endregion
  }, [status, messages.length]);

  // ── Derive permit data from AI tool calls ──────────────────────────────────
  useEffect(() => {
    const next = extractPermitUpdatesFromMessages(messages);
    
    // Inject session data if present and not overwritten by AI tools
    if (sessionRef.current) {
        if (!next.catering_dba && sessionRef.current.businessName) next.catering_dba = sessionRef.current.businessName;
        if (!next.owner_name && sessionRef.current.ownerName) next.owner_name = sessionRef.current.ownerName;
        if (!next.owner_email && sessionRef.current.email) next.owner_email = sessionRef.current.email;
        if (!next.owner_phone && sessionRef.current.phone) next.owner_phone = sessionRef.current.phone;
    }
    setPermitData(next);
  }, [messages]);

  // ── Restore saved form data on first mount (no messages yet = fresh session) ──
  // Runs after the messages effect above, so it wins when messages are empty.
  // This avoids SSR hydration issues (we never read localStorage during SSR).
  useEffect(() => {
    const savedMessages = loadSavedMessages();
    if (savedMessages && savedMessages.length > 0 && messages.length === 0) {
      setMessages(savedMessages);
    }

    const savedSession = loadSavedSessionData();
    if (savedSession) {
      setSession(savedSession);
    }
    
    if (messagesHaveToolUpdates(messages) || (savedMessages && messagesHaveToolUpdates(savedMessages))) return; // AI data takes priority
    const saved = loadSavedFormData();
    if (saved) {
        setPermitData(saved);
        if (savedSession) {
            if (!saved.catering_dba || saved.catering_dba === "") saved.catering_dba = savedSession.businessName;
            if (!saved.owner_name || saved.owner_name === "") saved.owner_name = savedSession.ownerName;
            if (!saved.owner_email || saved.owner_email === "") saved.owner_email = savedSession.email;
            if (!saved.owner_phone || saved.owner_phone === "") saved.owner_phone = savedSession.phone;
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally runs only once on mount

  // ── Persist form data whenever it changes ─────────────────────────────────
  useEffect(() => {
    saveFormData(permitData);
  }, [permitData]);

  // ── Persist messages whenever they change ─────────────────────────────────
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

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

  // ── Input states ───────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");

  const handleIntakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeForm.businessName || !intakeForm.ownerName || !intakeForm.email || !intakeForm.phone || !intakeForm.consent) return;
    
    const newSession = {
        sessionId: crypto.randomUUID(),
        ...intakeForm
    };
    
    setSession(newSession);
    saveSessionData(newSession);
    
    // Inject the session details immediately into the permitData so they reflect in the PDF UI.
    setPermitData(prev => ({
        ...prev,
        catering_dba: newSession.businessName,
        owner_name: newSession.ownerName,
        owner_email: newSession.email,
        owner_phone: newSession.phone
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
    clearFormData();
    window.location.reload();
  }, []);

  // ── Voice input ───────────────────────────────────────────────────────────

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

  const t = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;

  // ── Derived: can the user download? What's missing? ───────────────────────
  const missingFields: string[] = [];
  if (!permitData.catering_dba) missingFields.push(t.missingDba);
  if (!permitData.owner_name) missingFields.push(t.missingOwner);
  if (!permitData.owner_phone) missingFields.push(t.missingPhone);
  if (!permitData.owner_email) missingFields.push(t.missingEmail);
  if (permitData.menu_items.length === 0) missingFields.push(t.missingMenu);

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
              {t.title}
            </h1>
            <p className="text-slate-600 mt-1">
              {t.subtitle} <span className="font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded ml-2">{t.pricingTrial}</span>
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
              {t.startOver}
            </Button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Label className="text-slate-700 font-medium">{t.languageLabel}</Label>
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
        {/* Main interactive area (Form or Chat) */}
        <div className="lg:col-span-2 space-y-3">
          
          {!session ? (
            // Intake Form
            <div className="rounded-2xl border bg-white p-8">
              <div className="max-w-md mx-auto">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t.intakeTitle}</h2>
                <p className="text-slate-500 text-sm mb-6">{t.intakeSubtitle}</p>
                
                <form onSubmit={handleIntakeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">{t.intakeBusinessName} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="businessName"
                      required
                      value={intakeForm.businessName}
                      onChange={(e) => setIntakeForm(prev => ({...prev, businessName: e.target.value}))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">{t.intakeOwnerName} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="ownerName"
                      required
                      value={intakeForm.ownerName}
                      onChange={(e) => setIntakeForm(prev => ({...prev, ownerName: e.target.value}))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.intakeEmail} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="email"
                      type="email"
                      required
                      value={intakeForm.email}
                      onChange={(e) => setIntakeForm(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t.intakePhone} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="phone"
                      type="tel"
                      required
                      value={intakeForm.phone}
                      onChange={(e) => setIntakeForm(prev => ({...prev, phone: e.target.value}))}
                    />
                  </div>
                  
                  <div className="flex items-start space-x-3 pt-4 pb-2">
                    <Checkbox 
                      id="consent" 
                      checked={intakeForm.consent}
                      onCheckedChange={(checked) => setIntakeForm(prev => ({...prev, consent: checked as boolean}))}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label 
                        htmlFor="consent" 
                        className="text-sm text-slate-500 font-medium leading-tight cursor-pointer"
                      >
                        {t.intakeConsent} <span className="text-red-500">*</span>
                      </label>
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!intakeForm.businessName || !intakeForm.ownerName || !intakeForm.email || !intakeForm.phone || !intakeForm.consent}
                  >
                    {t.intakeStartChat}
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            // Active Chat Interface
            <div className="rounded-2xl border bg-white min-h-[320px] max-h-[480px] flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                  {/* Welcome message — shown only before first exchange */}
                  {messages.length === 0 && (
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl px-4 py-3 text-sm bg-slate-100 text-slate-900 space-y-2">
                        <p className="font-semibold">
                          {t.welcomeGreeting}
                        </p>
                        <p>
                          {t.welcomeIntro}
                        </p>
                        <p>
                          {t.welcomeQuestion}
                        </p>
                        <p className="text-slate-500 text-xs flex items-center gap-1">
                          <ChevronDown className="h-3 w-3" />
                          {t.typeOrSpeak}
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
                {/* End of messages ref inside scrollable container */}
                <div ref={messagesEndRef} className="h-4 shrink-0" />
              </div>

              {/* Fixed bottom area for input and errors */}
              <div className="p-4 pt-2 bg-white border-t border-slate-100 flex flex-col shrink-0 gap-3 mt-auto">
                {/* Mic error banner */}
                {micError && (
                  <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{micError}</span>
                  </div>
                )}

                {/* Input row */}
                <form onSubmit={handleSubmit} className="flex items-end gap-2 relative m-0">
                {speechSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={toggleMic}
                    className={cn(isListening && "bg-red-100 border-red-300", "mb-[2px]")}
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
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={t.placeholder}
                  className="flex-1 min-h-[60px] resize-y"
                  disabled={isLoading}
                  data-testid="permit-chat-input"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  data-testid="permit-chat-send"
                  className="mb-[2px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: form summary + download */}
    <div className="space-y-4">
          <div className="rounded-2xl border bg-slate-50 p-4">
            <h2 className="font-semibold text-slate-900 mb-3">{t.appSoFar}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">{t.fieldDba}</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.catering_dba || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.fieldOwner}</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.owner_name || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.fieldPhoneEmail}</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.owner_phone || "—"} / {permitData.owner_email || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.fieldMenu}</dt>
                <dd className="font-medium text-slate-900">
                  {permitData.menu_items.length > 0
                    ? permitData.menu_items.map((i) => i.food).join(", ")
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">{t.fieldHost}</dt>
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
                
                // Trigger background notification silently
                if (session) {
                  notifyPermitSession(session, permitData, missingFields, Object.keys(DEFAULT_PERMIT_DATA).length).catch(console.error);
                }
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
            {t.downloadBtn}
          </Button>

          {/* Save Progress Button */}
          {session && (
            <Button
              variant="outline"
              className="w-full text-slate-600 border-slate-300 hover:bg-slate-100"
              disabled={isDownloading}
              onClick={() => {
                // Manually trigger the notification without generating the PDF
                notifyPermitSession(session, permitData, missingFields, Object.keys(DEFAULT_PERMIT_DATA).length)
                  .then(() => alert("Your progress has been saved and our team has been notified. Thank you!"))
                  .catch(console.error);
              }}
            >
              Finish Session / Save Progress
            </Button>
          )}

          {/* Missing fields hint — shown when button is disabled */}
          {!canDownload && missingFields.length > 0 && (
            <div className="text-xs text-slate-500 bg-slate-100 rounded-xl px-3 py-2 space-y-1">
              <p className="font-medium text-slate-600">{t.stillNeeded}</p>
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
            {t.footerNote} <br/><span className="font-semibold text-emerald-600">{t.pricingTrial}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

