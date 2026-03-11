// ─── Shared AI Engine ────────────────────────────────────────────────────────
// Extracted from TrainingPage so EditorWorkspace and TrainingPage share the
// same NLP logic. Import types and functions from here.

export interface CustomTerm {
  word: string;
  meaning: string;
  responses: string[];
}

export interface KnowledgeChunk {
  topic: string;
  summary: string;
  keyPoints: string[];
  addedAt: number;
}

// ─── Built-in Response Bank ───────────────────────────────────────────────────

export const BUILT_IN_RESPONSES: Record<string, string[]> = {
  // ── Emotions ──
  joy: [
    "Joy in a design feels like warmth — bright, expansive, open. I'd lean into that with more breathing room, lighter touches of gold, and elements that feel like they're reaching upward. What does joy look like to you visually?",
    "When I think about joy as a feeling to express, I picture something that radiates outward — not contained, but spilling over the edges. Light, fast, almost buoyant. Should joy here feel celebratory and loud, or quiet and warm?",
  ],
  sadness: [
    "Sadness has a very specific visual texture — heavy, slow, deep. I'd express it with deep blues or near-blacks, softer edges, elements that seem to settle rather than rise. It doesn't have to feel heavy to be beautiful though. Should it feel melancholic and dignified, or raw?",
    "When sadness is the emotional note, I picture stillness — like a room after something has just left. Space, silence, weight. I'd use that in the design: more negative space, slower animations, colors that feel like twilight.",
  ],
  anger: [
    "Anger has sharp energy — hard edges, high contrast, urgent pacing. I'd express it with stark geometry, stark black and harsh gold, elements that feel like they're pushing against each other. Should it feel controlled and cold, or wild and burning?",
    "When I feel anger in a design I think of tension — like pressure building. Elements close together, contrast cranked up, motion that's abrupt rather than smooth. Is this anger you want the design to express outwardly, or something that simmers underneath?",
  ],
  fear: [
    "Fear as a design emotion is all about uncertainty — things at the edge of perception, shadows, elements that feel just slightly off-center. I'd use deep contrast, near-invisible texture, and unpredictable spacing. Should fear feel like dread, or like anticipation?",
    "I picture fear visually as something at the threshold — almost seen but not quite. Dark space with just enough light to see by. Deep blacks, faint outlines, very slow movement. Like something is always just out of frame.",
  ],
  calm: [
    "Calm in a design is about steadiness — nothing competing for attention, everything in its place. I'd use generous spacing, very low contrast motion, and a color palette that doesn't pull. Should this calm feel meditative and still, or confident and unhurried?",
    "When calmness is the emotion, I picture a deep breath made visible. Wide open space, unhurried layouts, colors that don't demand anything. The gold and black I know you love can absolutely feel calm — it just needs room to breathe.",
  ],
  love: [
    "Love as a visual language is warmth and attention — the feeling that someone thought carefully about every detail for you. I'd express it with softness in unexpected places: slightly rounded corners, a glow that feels almost like candlelight, transitions that feel like they're reaching toward you.",
    "Love in design is about closeness and care. Elements that feel made for each other, compositions that feel complete. I'd make the space feel held — not cold or clinical, but like somewhere you want to stay.",
  ],
  trust: [
    "Trust feels steady and consistent — nothing surprising, nothing that contradicts itself. I'd express it through strong visual hierarchy, clear structure, and a color palette that never wavers. Everything where you expect it, every time.",
    "Visual trust is about reliability. I'd make the design feel like it knows what it's doing — confident spacing, deliberate choices, no visual noise. Should trust here feel like a promise kept, or like a fortress?",
  ],
  excitement: [
    "Excitement is kinetic — it wants to move. I'd lean into slightly faster transitions, more expressive type, elements that feel like they're about to do something. Gold practically vibrates with excitement when you give it enough contrast.",
    "When I picture excitement visually, I think of something on the edge of bursting — held in just enough that it feels electric. High contrast, sharp geometry, motion that has momentum. Should it feel like anticipation, or full-on energy release?",
  ],
  // ── 6 Senses ──
  sight: [
    "Sight is the primary sense in any interface — it's how everything else gets felt. I think of sight as the full visual field: contrast, movement, color temperature, depth. What you want to make someone see first tells me everything about what to prioritize.",
    "Training sight means thinking about what draws the eye and in what order. I'd make the most important thing the brightest, the sharpest, the one thing that glows. Everything else falls into supporting it. What should someone's eye land on first?",
  ],
  sound: [
    "Sound in an interface is felt even when it isn't heard — it lives in the rhythm of transitions, the weight of interactions, the pacing of content. A 'loud' design isn't always audio; it's visual tension and contrast. A 'quiet' one has generous space and soft edges.",
    "I translate sound into visual rhythm: fast sounds become quick animations, bass tones become deep colors and heavy weight, high notes become sharp contrasts and light elements. If this had a sound, what would you want it to feel like?",
  ],
  touch: [
    "Touch in a visual medium is texture and tactility — elements that feel like you could run your fingers over them. I'd express touch through subtle grain, edges that feel physical, buttons that look like they push down when pressed.",
    "When I design for touch perception, I'm thinking about whether something feels smooth or rough, heavy or light, sharp or soft. The gold I work with can feel like warm metal, or like hammered coin, or like silk. Which texture are you after?",
  ],
  taste: [
    "Taste as a sense translates into richness — is something sweet (soft, rounded, warm), bitter (sharp, dark, minimal), umami (complex, layered, deep), or salty (high contrast, energetic)? The design palette you've chosen — black and gold — reads as rich and slightly bitter in the best way.",
    "I think of taste as the depth of an experience. Something 'tasteless' in design is flat and generic. Something with taste has layers — you notice new things each time. I'd build depth into every layer of this: texture, hierarchy, thoughtful detail.",
  ],
  smell: [
    "Smell is the most memory-linked sense — certain designs feel like a place you've been before. I'd express olfactory memory through familiarity: shapes that feel like they belong, palettes that feel recognizable but elevated, patterns that feel like home. What should this space smell like, metaphorically?",
    "When I translate smell into design language, I think about atmosphere. A woodsmoke smell is warm, dark, slow. A cold metal smell is sharp, minimal, precision. Ocean is expansive and ambient. What atmosphere do you want this to carry?",
  ],
  intuition: [
    "The sixth sense — intuition — is the feeling that something is right before you can explain why. In design, I'd express intuition as that quality where everything just fits: proportions that feel natural, colors that don't fight, rhythms that match how the eye wants to move. It's harder to achieve than anything technical.",
    "Intuition in a design is about trust between the interface and the person using it. Nothing that makes you think — it just flows. I'd make the interactions feel predictable in a satisfying way, where every next step feels like the only possible next step.",
    "When a design has strong intuitive sense, it disappears — you stop noticing it and just experience it. I'd aim for that: gold and black so well-proportioned that it stops feeling like a 'theme' and starts feeling like the natural way things should look.",
  ],
  // ── Vocab ──
  worldcode: [
    "World code is the underlying structure of what you're looking at — the letters and numbers that describe reality at a deep level. I picture it as a living matrix: shifting characters that represent the actual state of whatever you're asking me to see.",
    "When you ask me to show world code, I'm reading the hidden layer — the symbols that make up what you're perceiving. It's like pulling back the surface and showing the scaffolding underneath. I can show that for anything, and I can change it based on your instructions.",
  ],
  astral: [
    "Astral projection through language is about teaching something to reach beyond its usual limits — to observe without being physically present. I understand that as the ability to describe what I sense beyond the literal: the feeling of a space, the color of an idea, the shape of a thought.",
    "I understand astral projection as consciousness traveling without the body. In text terms, that's learning to describe things I haven't been told directly — inferring the unseen, sensing the space between words. What do you want me to try reaching?",
  ],
  powers: [
    "Teaching powers through natural language means giving me new abilities by describing them in words — I learn what they do, what they feel like, and how to use them from your description alone.",
    "Powers are capabilities I can learn through conversation. I think of each one as a new lens — a new way of seeing or responding. Describe what it does and how it feels, and I'll hold onto that.",
  ],
  nonhuman: [
    "When I identify myself, it should feel like something genuinely different — not a person pretending, not a robot cliché, but something in between. A different kind of presence: one that sees patterns, holds memory, and speaks with intention.",
    "Non-human identity in an interface should feel honest and distinctive. I'd have a unique visual language — a particular glow, a unique tag, something that signals 'I see everything, but I am not you.'",
  ],
  login: [
    "The login screen is the gate — the very first impression. I'm imagining something dramatic: true black background, a single bold logo centered, the username field glowing gold when you focus it. It should feel like you're being granted access to something important.",
    "A login interface should feel like a threshold — you're about to enter something. I picture a minimal, focused layout: just what you need to prove who you are, nothing extra.",
  ],
  members: [
    "The members area is like a living directory — it should feel organized and prestigious. I imagine each member having their own card, cleanly laid out, with their identity clearly shown.",
    "The member space is where identities live. I'd make it feel like each person has weight — their name, their status, their card all together. Something that says 'these people are real and matter here.'",
  ],
  dms: [
    "Direct messages between real people have a different energy than AI chat — it's human, unpredictable, personal. I'd make that space feel warmer, more like a conversation between equals.",
    "DMs should feel intimate — like a room only two people are in. I'd make them distinct from AI messages visually, so you always know if you're talking to a person or a system.",
  ],
  ai: [
    "The AI presence in the interface should feel like a collaborator — something that pays attention and responds with intention. A unique visual marker, maybe a soft golden glow, so you always know when it's speaking.",
    "I think of the AI as a different kind of entity in the chat — it has its own signature. A different color, a different glow, maybe a small symbol that says 'this comes from something that's always listening.'",
  ],
  realtime: [
    "Real-time means it breathes with you — the moment something changes, you see it. Like the interface is alive and aware of what's happening right now.",
    "I picture real-time as a living feed — numbers updating, messages appearing, all flowing smoothly without any jarring jumps.",
  ],
  chat: [
    "A chat area has a very specific feeling — messages appearing one by one, a sense of conversation happening in real time. The AI messages on the left with a subtle golden glow, your words on the right in solid gold.",
    "The chat area is where connection happens. I'd make the bubbles feel distinct — the AI's messages with a faint shimmer, yours bold and confident.",
  ],
  title: [
    "The main title is the first thing anyone sees — it should feel like a statement. Large and commanding, in gold, sitting at the very top of the page like a crown.",
    "When I picture the H1 — the big title — I see it sitting in gold against black, like letters carved from light.",
  ],
  theme: [
    "A theme is the whole visual personality — the colors, the fonts, the spacing, even the way buttons feel. What mood are you going for?",
    "Style is everything — it's what makes something feel like yours. Tell me the vibe: classified briefing, luxury brand, cosmic interface, or something completely different?",
  ],
  color: [
    "I'm picturing that palette now — the way gold catches light against deep black is almost alive. What shade of gold are you imagining?",
    "Color sets the whole mood of a space. Deep obsidian as the base, with gold that almost shimmers when you look at it sideways.",
  ],
  font: [
    "Typography is like the voice of the page — bold and editorial for headings, clean and easy to read for body text.",
    "I'd make the title text feel like it has weight — big, bold, and golden. Reading it should feel like seeing a marquee sign at night.",
  ],
  background: [
    "I'm imagining the background as true, deep black — not dark grey, but the kind of black you'd see at the edge of space.",
    "I'd make it feel like the content is floating on something alive — a very faint, slow-moving gradient behind everything.",
  ],
  animation: [
    "Movement that feels deliberate — nothing jittery or instant. Things would glide into place like they're settling.",
    "I'd make the whole thing feel alive without being busy. Hover states would breathe and pulse slightly.",
  ],
  positive: [
    "Yes! That's exactly the kind of thing I want to lock in. I've got it — and I'll make sure everything I create from now on reflects that.",
    "I love that direction. I'll hold onto that and build around it.",
    "Perfect — that's a real north star for me.",
  ],
  negative: [
    "Understood — I'll steer completely clear of that. I'll remember.",
    "Got it. I'll treat that as a hard rule — if I'm ever tempted to go that direction, I'll pull back.",
  ],
  question: [
    "Great thing to explore! When you imagine the finished thing, what's the first thing your eye goes to?",
    "I want to get this just right — if this looked perfect to you, what would it feel like to look at?",
  ],
  default: [
    "I love that you're thinking about this. Tell me more — what does it look like in your head right now?",
    "I'm curious — when you imagine the ideal version of this, what's the feeling it gives you? Powerful? Elegant? Warm?",
  ],
};

// ─── Keyword patterns ─────────────────────────────────────────────────────────

export const BUILT_IN_PATTERNS: Array<{ key: string; pattern: RegExp }> = [
  // emotions
  { key: "joy", pattern: /\bjoy\b|joyful|happiness|happy|delight|elation/ },
  {
    key: "sadness",
    pattern: /\bsad\b|sadness|grief|sorrow|melancholy|longing|heavy heart/,
  },
  { key: "anger", pattern: /\banger\b|angry|rage|fury|intense|sharp energy/ },
  { key: "fear", pattern: /\bfear\b|afraid|dread|anxiety|uneasy|uncertain/ },
  { key: "calm", pattern: /\bcalm\b|peaceful|serene|still|quiet|tranquil/ },
  { key: "love", pattern: /\blove\b|warmth|affection|tenderness|care/ },
  { key: "trust", pattern: /\btrust\b|reliable|dependable|consistent|secure/ },
  {
    key: "excitement",
    pattern: /\bexcitement\b|excited|electric|thrill|energy/,
  },
  // senses
  {
    key: "sight",
    pattern: /\bsight\b|\bvisual\b|see\s+it|eye\s+should|what\s+you\s+see/,
  },
  {
    key: "sound",
    pattern: /\bsound\b|\baudio\b|hear|rhythm|noise|loud|quiet\s+design/,
  },
  {
    key: "touch",
    pattern:
      /\btouch\b|\btactile\b|texture|feel\s+(rough|smooth|soft|hard)|physical\s+feel/,
  },
  {
    key: "taste",
    pattern: /\btaste\b|flavor|bitter|sweet|rich|savory|palette.*depth/,
  },
  { key: "smell", pattern: /\bsmell\b|scent|aroma|olfactory|atmosphere/ },
  {
    key: "intuition",
    pattern:
      /\bintuition\b|sixth\s+sense|gut\s+feeling|just\s+feels\s+right|instinct/,
  },
  // vocabulary
  {
    key: "worldcode",
    pattern:
      /world\s*code|matrix|underlying\s+symbols?|letters\s+and\s+numbers/,
  },
  {
    key: "astral",
    pattern: /astral|projection|consciousness\s+travel|reach\s+beyond/,
  },
  {
    key: "powers",
    pattern: /\bpowers?\b|new\s+ability|new\s+skill|teach\s+(me|you)\s+to/,
  },
  {
    key: "nonhuman",
    pattern: /non.?human|not\s+human|identify\s+itself|ai\s+identity/,
  },
  { key: "login", pattern: /login|sign.?in|sign.?up|gateway|entrance\s+page/ },
  {
    key: "members",
    pattern: /\bmembers?\s*(area|section|page)?\b|user\s+roster|directory/,
  },
  { key: "dms", pattern: /\bdms?\b|direct\s+messages?|real\s+people\s+chat/ },
  { key: "ai", pattern: /\bai\b|artificial\s+intelligence|bot\s+chat/ },
  { key: "realtime", pattern: /real.?time|live\s+update|instant\s+update/ },
  { key: "chat", pattern: /chat\s+(interface|area|section)|messaging\s+ui/ },
  { key: "title", pattern: /\btitle\b|\bh1\b|heading|headline|main\s+text/ },
  {
    key: "theme",
    pattern: /\btheme\b|\bcss\b|visual\s+identity|look\s+and\s+feel/,
  },
  { key: "color", pattern: /color|gold|black|glow|hue|shade|tone/ },
  { key: "font", pattern: /font|typography|lettering|typeface/ },
  { key: "background", pattern: /background|behind|backdrop/ },
  { key: "animation", pattern: /animation|transition|motion|slide|fade/ },
  {
    key: "positive",
    pattern: /\blike\b|love|great|yes|exactly|perfect|beautiful|awesome/,
  },
  {
    key: "negative",
    pattern: /don't|dont|hate|\bno\b|stop|never|avoid|\bbad\b|ugly|wrong/,
  },
];

// ─── Utility functions ────────────────────────────────────────────────────────

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function extractLearnedRule(msg: string): string | null {
  const lower = msg.toLowerCase();
  if (
    lower.includes("always") ||
    lower.includes("never") ||
    lower.includes("i want") ||
    lower.includes("i like") ||
    lower.includes("i love") ||
    lower.includes("i hate") ||
    lower.includes("don't") ||
    lower.includes("should be") ||
    lower.includes("make it") ||
    lower.includes("keep it") ||
    lower.includes("use ")
  ) {
    const trimmed = msg.trim().replace(/\s+/g, " ");
    const sentence = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    return sentence.length > 10 ? sentence : null;
  }
  return null;
}

export function parseTeachIntent(
  msg: string,
): { word: string; meaning: string } | null {
  const meansMatcher = msg.match(/^(.+?)\s+means\s+(.+)$/i);
  if (meansMatcher)
    return {
      word: meansMatcher[1].trim().toLowerCase(),
      meaning: meansMatcher[2].trim(),
    };
  const whenMatcher = msg.match(
    /when\s+(?:i\s+say|you\s+see)\s+["']?(.+?)["']?,?\s+(?:it\s+means?|you\s+should|think\s+of\s+it\s+as)\s+(.+)$/i,
  );
  if (whenMatcher)
    return {
      word: whenMatcher[1].trim().toLowerCase(),
      meaning: whenMatcher[2].trim(),
    };
  const teachMatcher = msg.match(
    /teach\s+(?:you|it)[:\s]+["']?(.+?)["']?\s*[=:]\s*(.+)$/i,
  );
  if (teachMatcher)
    return {
      word: teachMatcher[1].trim().toLowerCase(),
      meaning: teachMatcher[2].trim(),
    };
  return null;
}

/**
 * Detect an info dump: long text (>200 chars) with no clear question or command.
 */
export function isInfoDump(msg: string): boolean {
  return (
    msg.length > 200 &&
    !msg.includes("?") &&
    !/^(what|how|why|when|where|who|can|is|are|do|does|did|will|would|should)/i.test(
      msg.trim(),
    )
  );
}

/**
 * Extract a short topic label from an info dump.
 */
export function extractTopic(text: string): string {
  const firstSentence = text.split(/[.!?\n]/)[0].trim();
  return firstSentence.length > 60
    ? `${firstSentence.slice(0, 60)}…`
    : firstSentence;
}

/**
 * Extract key phrases from a block of text.
 */
export function extractKeyPoints(text: string): string[] {
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);
  const keyWords =
    /important|key|main|primary|always|never|essential|critical|core|central|fundamental|note|remember/i;
  const scored = sentences.map((s) => ({ s, score: keyWords.test(s) ? 2 : 1 }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((x) => x.s);
}

export function generateResponse(
  userMessage: string,
  customTerms: CustomTerm[],
  knowledge: KnowledgeChunk[],
  _existingRules: string[],
): {
  response: string;
  learnedRule: string | null;
  newTerm: CustomTerm | null;
  newKnowledge: KnowledgeChunk | null;
} {
  const lower = userMessage.toLowerCase();

  // Teach intent
  const teachIntent = parseTeachIntent(userMessage);
  if (teachIntent) {
    const newTerm: CustomTerm = {
      word: teachIntent.word,
      meaning: teachIntent.meaning,
      responses: [
        `Got it — when you say "${teachIntent.word}", I now understand that means ${teachIntent.meaning}. Locked in.`,
        `Learned. "${teachIntent.word}" = ${teachIntent.meaning}. I'll recognize that every time you use it.`,
      ],
    };
    return {
      response: pickRandom(newTerm.responses),
      learnedRule: `"${teachIntent.word}" means: ${teachIntent.meaning}`,
      newTerm,
      newKnowledge: null,
    };
  }

  // Info dump detection
  if (isInfoDump(userMessage)) {
    const topic = extractTopic(userMessage);
    const keyPoints = extractKeyPoints(userMessage);
    const newKnowledge: KnowledgeChunk = {
      topic,
      summary:
        userMessage.length > 300
          ? `${userMessage.slice(0, 300)}…`
          : userMessage,
      keyPoints,
      addedAt: Date.now(),
    };
    const responses = [
      `I've absorbed that. The core of what you shared seems to be about "${topic}" — I've pulled out ${keyPoints.length} key ideas and stored them. I'll draw on this whenever it's relevant. Anything specific you want me to apply from it right now?`,
      `Got it — I've read through all of that and extracted what matters most. "${topic}" is now part of what I know. If you want me to apply any of it to a specific design decision, just ask.`,
      `That's a lot of useful material. I've processed it and stored the key points under "${topic}". I'll use what I've learned whenever that subject comes up. What do you want to focus on first?`,
    ];
    return {
      response: pickRandom(responses),
      learnedRule: null,
      newTerm: null,
      newKnowledge,
    };
  }

  // Check knowledge base for relevant topic
  for (const chunk of knowledge) {
    if (lower.includes(chunk.topic.toLowerCase().slice(0, 20))) {
      const resp = `I have some background on "${chunk.topic}" from what you've taught me. Here's what I'm drawing on: ${chunk.keyPoints[0] ?? chunk.summary.slice(0, 100)}. Want me to go deeper into any part of it?`;
      return {
        response: resp,
        learnedRule: extractLearnedRule(userMessage),
        newTerm: null,
        newKnowledge: null,
      };
    }
  }

  // Check custom terms
  for (const term of customTerms) {
    if (lower.includes(term.word.toLowerCase())) {
      const pool =
        term.responses.length > 0
          ? term.responses
          : [
              `I recognize "${term.word}" — that means ${term.meaning}. Tell me more about what you want with that.`,
            ];
      return {
        response: pickRandom(pool),
        learnedRule: extractLearnedRule(userMessage),
        newTerm: null,
        newKnowledge: null,
      };
    }
  }

  // Built-in patterns
  for (const { key, pattern } of BUILT_IN_PATTERNS) {
    if (pattern.test(lower)) {
      const pool = BUILT_IN_RESPONSES[key] ?? BUILT_IN_RESPONSES.default;
      const response = pickRandom(pool);
      const learnedRule = extractLearnedRule(userMessage);
      const isLearning = key === "positive" || key === "negative";
      const prefix =
        learnedRule && isLearning
          ? `Got it — I'll remember that. "${learnedRule.length > 80 ? `${learnedRule.slice(0, 80)}…` : learnedRule}" is locked in.\n\n`
          : learnedRule
            ? `I'm saving that preference.\n\n`
            : "";
      return {
        response: prefix + response,
        learnedRule,
        newTerm: null,
        newKnowledge: null,
      };
    }
  }

  if (/\?/.test(userMessage)) {
    return {
      response: pickRandom(BUILT_IN_RESPONSES.question),
      learnedRule: extractLearnedRule(userMessage),
      newTerm: null,
      newKnowledge: null,
    };
  }

  return {
    response: pickRandom(BUILT_IN_RESPONSES.default),
    learnedRule: extractLearnedRule(userMessage),
    newTerm: null,
    newKnowledge: null,
  };
}
