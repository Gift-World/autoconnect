import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Mic, MicOff, Search, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ROTATING_EXAMPLES, SUGGESTION_CHIPS } from "@/components/search/AiCarFinderSearchBar";

/**
 * The one search box on /cars. Plain words go in; the parent runs AI smart search
 * (server first, on-device parsing as a fallback) and turns them into filters.
 * Voice input, rotating examples and suggestion prompts live inside the box.
 */
export function SmartSearchBar({
  value,
  onValueChange,
  onSearch,
  onClear,
  searching = false,
  interpreted,
  inputId = "ai-search-input",
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onSearch: (text: string) => void;
  onClear?: () => void;
  searching?: boolean;
  /** Short labels describing what AI understood from the last search. */
  interpreted?: string[] | null;
  inputId?: string;
  className?: string;
}) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [focused, setFocused] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  const onValueChangeRef = useRef(onValueChange);
  onValueChangeRef.current = onValueChange;

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % ROTATING_EXAMPLES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string;
      setIsListening(false);
      onValueChangeRef.current(transcript);
      toast.success("Voice captured", { description: `“${transcript}”` });
      onSearchRef.current(transcript);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice input error. Please try typing your search.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error("Voice search is not supported in this browser. Please type your query.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }
    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening…", {
        description: "Say what car you're looking for (e.g. 'Toyota SUV under 4 million')",
      });
    } catch {
      /* already started */
    }
  };

  const showSuggestions = focused && !value.trim();

  return (
    <div className={cn("relative w-full min-w-0", className)}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearch(value);
        }}
        className={cn(
          "flex h-14 w-full min-w-0 items-center gap-1 rounded-full border bg-card pl-2 pr-1.5 shadow-[0_6px_24px_-12px_rgba(11,19,36,0.35)] transition",
          focused ? "border-foreground/40" : "border-border",
        )}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ac-ink text-ac-accent">
          <Sparkles className="h-4 w-4" />
        </span>
        <label htmlFor={inputId} className="sr-only">
          Describe the car you want
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(e) => onValueChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={`Try “${ROTATING_EXAMPLES[placeholderIndex]}”`}
          className="h-full min-w-0 flex-1 bg-transparent px-2 text-[15px] font-medium text-foreground outline-none placeholder:text-muted-foreground"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onValueChange("");
              onClear?.();
            }}
            className="grid h-11 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={toggleVoiceInput}
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-full transition",
            isListening
              ? "animate-pulse bg-destructive text-white"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
          aria-label={isListening ? "Stop listening" : "Search by voice"}
          title={isListening ? "Listening… tap to stop" : "Search by voice"}
        >
          {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
        <button
          type="submit"
          disabled={searching}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ac-accent px-4 text-sm font-extrabold text-ac-ink transition hover:brightness-105 disabled:opacity-70 sm:px-5"
          aria-label="Search with AI"
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="hidden sm:inline">{searching ? "Thinking…" : "Search"}</span>
        </button>
      </form>

      {/* Suggestions panel (focus + empty input) */}
      {showSuggestions && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-30 rounded-3xl border border-border bg-card p-4 shadow-xl">
          <p className="brand-kicker flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-foreground" /> Ask in your own words
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.query}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onValueChange(chip.query);
                  onSearch(chip.query);
                  setFocused(false);
                }}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-background px-4 text-sm font-medium text-foreground transition hover:border-foreground/40"
              >
                {chip.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      )}

      {interpreted && interpreted.length > 0 && (
        <p className="mt-2 flex min-w-0 items-center gap-1.5 px-2 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-foreground" />
          <span className="shrink-0 font-semibold text-foreground">AI understood:</span>
          <span className="truncate">{interpreted.join(" · ")}</span>
        </p>
      )}
    </div>
  );
}
