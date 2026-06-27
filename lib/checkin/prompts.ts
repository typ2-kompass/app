// Deterministic daily prompt rotation: same prompt for all users on the same
// calendar day. Uses a stable hash of the date string so no DB lookup needed.

export interface Prompt {
  key: string;
  text: string;
}

export const PROMPTS: Prompt[] = [
  { key: "p1", text: "Was hat dir heute gut getan?" },
  { key: "p2", text: "Welche kleine Entscheidung hast du heute bewusst für dich getroffen?" },
  { key: "p3", text: "Worauf bist du heute stolz – auch wenn es klein wirkt?" },
  { key: "p4", text: "Was hat heute mehr Energie gekostet als sonst?" },
  { key: "p5", text: "Wofür möchtest du dir heute Anerkennung geben?" },
  { key: "p6", text: "Was hast du heute über dich gelernt?" },
  { key: "p7", text: "Welche Situation hat dich heute herausgefordert?" },
  { key: "p8", text: "Was hat dir heute Freude bereitet?" },
  { key: "p9", text: "Welcher Moment hat dich heute zum Innehalten gebracht?" },
  { key: "p10", text: "Was möchtest du dir für morgen mitnehmen?" },
];

function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

export function promptForDate(isoDate: string): Prompt {
  const idx = fnv1a(isoDate) % PROMPTS.length;
  return PROMPTS[idx];
}
