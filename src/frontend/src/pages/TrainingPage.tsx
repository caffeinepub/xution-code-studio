import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import {
  isCanisterStopped,
  useAIPreferenceRules,
  useAddAIPreference,
  useRemoveAIPreference,
} from "@/hooks/useQueries";
import {
  type CustomTerm,
  type KnowledgeChunk,
  generateResponse,
  isInfoDump,
  pickRandom,
} from "@/utils/aiEngine";
import {
  AlertTriangle,
  BookOpen,
  Brain,
  Plus,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "ai" | "user";
  text: string;
  learnedRule?: string | null;
  timestamp: number;
}

const SESSION_PREFIX = "__SESSION__:";
const CUSTOM_TERM_PREFIX = "__CTERM__:";
const KNOWLEDGE_PREFIX = "__KNOW__:";

// ─── Built-in Response Bank ───────────────────────────────────────────────────

const GREETING: Message = {
  id: "greeting",
  role: "ai",
  text: "Hey! I'm your visual AI trainer. I learn through conversation — and the more you teach me, the more I know.\n\nI already understand:\n• Design vocab: title, theme, chat interface, login, members, DMs, AI, real-time, world code\n• Emotions: joy, sadness, anger, fear, calm, love, trust, excitement\n• The 6 senses: sight, sound, touch, taste, smell, intuition\n\nYou can teach me anything new:\n• \"X means Y\" to define a term\n• Paste a block of text to info-dump a topic\n• Just talk and I'll pull out what to remember\n\nWhat's on your mind?",
  learnedRule: null,
  timestamp: Date.now(),
};

// ─── Backend Status Banner ────────────────────────────────────────────────────

function BackendOfflineBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="mx-4 mt-3 flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3"
      data-ocid="training.error_state"
    >
      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
      <p className="flex-1 text-xs text-yellow-400 leading-relaxed">
        <span className="font-semibold">
          Backend temporarily offline (IC0508).
        </span>{" "}
        Your conversation is still active, but saves won't persist until the
        service restarts.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-yellow-400/50 hover:text-yellow-400 transition-colors flex-shrink-0"
        aria-label="Dismiss"
        data-ocid="training.close_button"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Teach Term Panel ─────────────────────────────────────────────────────────

function TeachTermPanel({
  onTeach,
}: { onTeach: (word: string, meaning: string) => void }) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) return;
    onTeach(word.trim(), meaning.trim());
    setWord("");
    setMeaning("");
  };
  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-yellow-500/15 bg-black/30 space-y-2"
    >
      <p className="text-[10px] text-yellow-400/50 font-medium uppercase tracking-wider flex items-center gap-1">
        <Plus className="w-3 h-3" /> Teach a New Term
      </p>
      <div className="space-y-1.5">
        <Input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder='Word (e.g. "spark")'
          className="h-7 text-xs bg-black/50 border-yellow-500/20 text-yellow-100/80 placeholder:text-yellow-400/25 focus-visible:ring-yellow-500/30"
          data-ocid="training.teach_word_input"
        />
        <Input
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder='What it means (e.g. "a glowing element")'
          className="h-7 text-xs bg-black/50 border-yellow-500/20 text-yellow-100/80 placeholder:text-yellow-400/25 focus-visible:ring-yellow-500/30"
          data-ocid="training.teach_meaning_input"
        />
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={!word.trim() || !meaning.trim()}
        className="w-full bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-400 border border-yellow-500/25 text-xs h-7 gap-1 disabled:opacity-30"
        data-ocid="training.teach_submit_button"
      >
        Teach This Term
      </Button>
      <p className="text-[9px] text-yellow-400/20 text-center">
        Or type "X means Y" in chat · Paste text to info-dump a topic
      </p>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainingPage() {
  const { actor } = useActor();
  const { data: rules = [], isLoading: rulesLoading } = useAIPreferenceRules();
  const addRule = useAddAIPreference();
  const removeRule = useRemoveAIPreference();

  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [customTerms, setCustomTerms] = useState<CustomTerm[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeChunk[]>([]);
  const [backendDown, setBackendDown] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  // Show banner if actor is unavailable
  useEffect(() => {
    if (!actor) setBackendDown(true);
    else setBackendDown(false);
  }, [actor]);

  useEffect(() => {
    if (rulesLoading || sessionRestored) return;
    setSessionRestored(true);
    const loadedTerms: CustomTerm[] = [];
    const loadedKnowledge: KnowledgeChunk[] = [];
    for (const rule of rules) {
      if (rule.startsWith(CUSTOM_TERM_PREFIX)) {
        try {
          loadedTerms.push(JSON.parse(rule.slice(CUSTOM_TERM_PREFIX.length)));
        } catch {
          /* ignore */
        }
      } else if (rule.startsWith(KNOWLEDGE_PREFIX)) {
        try {
          loadedKnowledge.push(JSON.parse(rule.slice(KNOWLEDGE_PREFIX.length)));
        } catch {
          /* ignore */
        }
      }
    }
    if (loadedTerms.length > 0) setCustomTerms(loadedTerms);
    if (loadedKnowledge.length > 0) setKnowledge(loadedKnowledge);

    const sessionRule = [...rules]
      .reverse()
      .find((r) => r.startsWith(SESSION_PREFIX));
    if (!sessionRule) return;
    try {
      const saved = JSON.parse(
        sessionRule.slice(SESSION_PREFIX.length),
      ) as Message[];
      if (Array.isArray(saved) && saved.length > 0) setMessages(saved);
    } catch {
      /* ignore */
    }
  }, [rules, rulesLoading, sessionRestored]);

  const handleSaveSession = useCallback(async () => {
    if (isSaving || messages.length <= 1) return;
    setIsSaving(true);
    try {
      const stripped = messages.map((m) => ({
        ...m,
        text: m.text.length > 1500 ? `${m.text.slice(0, 1500)}…` : m.text,
      }));
      await addRule.mutateAsync(SESSION_PREFIX + JSON.stringify(stripped));
      toast.success("Training session saved");
    } catch (err) {
      if (isCanisterStopped(err)) {
        setBackendDown(true);
        toast.error("Backend offline (IC0508) — session not saved");
      } else {
        toast.error("Failed to save — check backend connection");
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, messages, addRule]);

  const handleTeachTerm = useCallback(
    async (word: string, meaning: string) => {
      const newTerm: CustomTerm = {
        word: word.toLowerCase(),
        meaning,
        responses: [
          `Understood — "${word}" means ${meaning}. I'll recognize that whenever you use it.`,
          `Learned. "${word}" = ${meaning}. Locked in permanently.`,
        ],
      };
      setCustomTerms((prev) => [
        ...prev.filter((t) => t.word !== newTerm.word),
        newTerm,
      ]);
      try {
        await addRule.mutateAsync(CUSTOM_TERM_PREFIX + JSON.stringify(newTerm));
        toast.success(`Taught: "${word}" = ${meaning}`);
      } catch (err) {
        if (isCanisterStopped(err)) {
          setBackendDown(true);
          toast.error("Backend offline — term saved locally only");
        } else {
          toast.error("Failed to save term to backend");
        }
      }
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: "ai",
        text: pickRandom(newTerm.responses),
        learnedRule: `"${word}" means: ${meaning}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(scrollToBottom, 50);
    },
    [addRule, scrollToBottom],
  );

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isThinking) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTimeout(scrollToBottom, 50);
    setIsThinking(true);

    // Longer think time for info dumps
    const thinkTime = isInfoDump(text)
      ? 1800 + Math.random() * 800
      : 800 + Math.random() * 600;
    await new Promise((r) => setTimeout(r, thinkTime));

    const { response, learnedRule, newTerm, newKnowledge } = generateResponse(
      text,
      customTerms,
      knowledge,
      rules,
    );

    if (newTerm) {
      setCustomTerms((prev) => [
        ...prev.filter((t) => t.word !== newTerm.word),
        newTerm,
      ]);
      try {
        await addRule.mutateAsync(CUSTOM_TERM_PREFIX + JSON.stringify(newTerm));
      } catch (err) {
        if (isCanisterStopped(err)) setBackendDown(true);
      }
    }
    if (newKnowledge) {
      setKnowledge((prev) => [...prev, newKnowledge]);
      try {
        await addRule.mutateAsync(
          KNOWLEDGE_PREFIX + JSON.stringify(newKnowledge),
        );
      } catch (err) {
        if (isCanisterStopped(err)) setBackendDown(true);
      }
    }

    const aiMsg: Message = {
      id: `a-${Date.now()}`,
      role: "ai",
      text: response,
      learnedRule,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsThinking(false);
    setTimeout(scrollToBottom, 50);

    if (learnedRule && !newTerm) {
      try {
        await addRule.mutateAsync(learnedRule);
      } catch (err) {
        if (isCanisterStopped(err)) setBackendDown(true);
      }
    }
  }, [
    input,
    isThinking,
    customTerms,
    knowledge,
    rules,
    addRule,
    scrollToBottom,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRemove = async (index: number) => {
    try {
      await removeRule.mutateAsync(BigInt(index));
      toast.success("Removed");
    } catch {
      toast.error("Failed to remove");
    }
  };

  const visibleRules = rules.filter(
    (r) =>
      !r.startsWith(SESSION_PREFIX) &&
      !r.startsWith("__MEMBER__:") &&
      !r.startsWith(CUSTOM_TERM_PREFIX) &&
      !r.startsWith(KNOWLEDGE_PREFIX),
  );

  return (
    <div
      className="flex h-full overflow-hidden"
      style={{ height: "calc(100vh - 64px)" }}
    >
      {/* ── Chat ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-500/20 bg-black/60 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-yellow-400 text-sm tracking-wide">
                  AI Training
                </span>
                <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/30 text-[10px] px-1.5 py-0">
                  Class 6
                </Badge>
              </div>
              <p className="text-[10px] text-yellow-400/40">
                Teach words · Info dump · Emotions · 6 Senses
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-500/10 border-yellow-500/30 text-yellow-400/70 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {visibleRules.length + customTerms.length + knowledge.length}{" "}
              learned
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveSession}
              disabled={isSaving || messages.length <= 1 || backendDown}
              title={
                backendDown ? "Backend offline — saves unavailable" : undefined
              }
              className="text-yellow-400/70 hover:text-yellow-400 hover:bg-yellow-500/10 text-xs h-7 px-2 gap-1 border border-yellow-500/20 disabled:opacity-30"
              data-ocid="training.save_button"
            >
              <Save className="w-3 h-3" />
              {isSaving ? "Saving…" : "Save Session"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar((v) => !v)}
              className="text-yellow-400/50 hover:text-yellow-400 hover:bg-yellow-500/10 text-xs h-7 px-2"
              data-ocid="training.sidebar_toggle"
            >
              {showSidebar ? "Hide" : "Memory"}
            </Button>
          </div>
        </div>

        {/* Backend offline banner */}
        <AnimatePresence>
          {backendDown && (
            <BackendOfflineBanner onDismiss={() => setBackendDown(false)} />
          )}
        </AnimatePresence>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={msg.id}
                data-ocid={`training.message.${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] ${msg.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
                        <Brain className="w-2.5 h-2.5 text-yellow-400" />
                      </div>
                      <span className="text-[10px] text-yellow-400/50 font-medium tracking-wide">
                        AI Trainer
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-yellow-500 text-black font-medium rounded-tr-sm"
                        : "bg-black border border-yellow-500/25 text-yellow-100/90 rounded-tl-sm shadow-[0_0_20px_rgba(234,179,8,0.05)]"
                    }`}
                  >
                    {msg.text.split("\n\n").map((para, pi) => (
                      <p
                        key={`${msg.id}-p-${pi}`}
                        className={pi > 0 ? "mt-2" : ""}
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                  {msg.learnedRule && (
                    <div className="mt-1.5 flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2.5 py-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                      <span className="text-[10px] text-yellow-400 font-medium">
                        Learned ✓
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isThinking && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex justify-start"
            >
              <div className="bg-black border border-yellow-500/25 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                {[0, 1, 2].map((j) => (
                  <motion.div
                    key={j}
                    className="w-1.5 h-1.5 rounded-full bg-yellow-400/60"
                    animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                    transition={{
                      duration: 1.2,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: j * 0.2,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-yellow-500/15 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-end gap-3">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Describe, teach ("X means Y"), or paste a topic to info-dump…'
              rows={1}
              className="flex-1 resize-none min-h-[44px] max-h-[160px] bg-black/50 border-yellow-500/25 text-yellow-100/90 placeholder:text-yellow-400/30 focus-visible:ring-yellow-500/40 focus-visible:border-yellow-500/50 rounded-xl text-sm overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties}
              data-ocid="training.input"
              disabled={isThinking}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isThinking}
              className="bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl h-11 w-11 p-0 flex-shrink-0 disabled:opacity-30"
              data-ocid="training.send_button"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-yellow-400/25 mt-2 text-center">
            Enter to send · Shift+Enter new line · Paste long text to info-dump
            a topic
          </p>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 290, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-l border-yellow-500/15 overflow-hidden flex flex-col"
          >
            <div className="px-4 py-3 border-b border-yellow-500/15 flex items-center justify-between bg-black/40">
              <div>
                <p className="text-xs font-semibold text-yellow-400">
                  AI Memory
                </p>
                <p className="text-[10px] text-yellow-400/40">
                  {customTerms.length} terms · {knowledge.length} topics ·{" "}
                  {visibleRules.length} prefs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSidebar(false)}
                className="text-yellow-400/30 hover:text-yellow-400/70"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <ScrollArea className="flex-1">
              {/* Custom terms */}
              {customTerms.length > 0 && (
                <div className="p-3 border-b border-yellow-500/10">
                  <p className="text-[10px] text-yellow-400/40 uppercase tracking-wider mb-2">
                    Custom Terms
                  </p>
                  <div className="space-y-1.5">
                    {customTerms.map((term, i) => (
                      <div
                        key={term.word}
                        className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-2.5"
                        data-ocid={`training.term.${i + 1}`}
                      >
                        <p className="text-[11px] font-mono text-yellow-400 font-semibold">
                          "{term.word}"
                        </p>
                        <p className="text-[10px] text-yellow-100/50 mt-0.5 leading-relaxed">
                          {term.meaning}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge topics */}
              {knowledge.length > 0 && (
                <div className="p-3 border-b border-yellow-500/10">
                  <p className="text-[10px] text-yellow-400/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5" /> Topics Learned
                  </p>
                  <div className="space-y-1.5">
                    {knowledge.map((chunk, i) => (
                      <div
                        key={chunk.addedAt}
                        className="bg-yellow-500/5 border border-yellow-500/15 rounded-lg p-2.5"
                        data-ocid={`training.topic.${i + 1}`}
                      >
                        <p className="text-[11px] text-yellow-400 font-semibold leading-snug">
                          {chunk.topic}
                        </p>
                        <p className="text-[10px] text-yellow-100/40 mt-0.5">
                          {chunk.keyPoints.length} key points stored
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              {rulesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-4 h-4 border-2 border-yellow-500/40 border-t-yellow-500 rounded-full animate-spin" />
                </div>
              ) : visibleRules.length === 0 &&
                customTerms.length === 0 &&
                knowledge.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center p-8 text-center gap-3"
                  data-ocid="training.empty_state"
                >
                  <Brain className="w-8 h-8 text-yellow-400/20" />
                  <p className="text-xs text-yellow-400/40 font-medium">
                    Nothing learned yet
                  </p>
                  <p className="text-[10px] text-yellow-400/25">
                    Chat, teach terms, or paste a topic
                  </p>
                </div>
              ) : (
                <div className="p-3 space-y-2" data-ocid="training.list">
                  {visibleRules.length > 0 && (
                    <p className="text-[10px] text-yellow-400/40 uppercase tracking-wider">
                      Preferences
                    </p>
                  )}
                  <AnimatePresence>
                    {rules.map((rule, i) => {
                      if (
                        rule.startsWith(SESSION_PREFIX) ||
                        rule.startsWith("__MEMBER__:") ||
                        rule.startsWith(CUSTOM_TERM_PREFIX) ||
                        rule.startsWith(KNOWLEDGE_PREFIX)
                      )
                        return null;
                      return (
                        <motion.div
                          key={rule.slice(0, 40)}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="group bg-yellow-500/5 border border-yellow-500/15 rounded-xl p-3 hover:border-yellow-500/25 transition-colors"
                          data-ocid={`training.item.${i + 1}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] text-yellow-100/70 leading-relaxed flex-1 min-w-0">
                              {rule}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleRemove(i)}
                              disabled={removeRule.isPending}
                              className="opacity-0 group-hover:opacity-100 text-yellow-400/30 hover:text-yellow-400/70 transition-all flex-shrink-0"
                              data-ocid={`training.delete_button.${i + 1}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>

            <TeachTermPanel onTeach={handleTeachTerm} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
