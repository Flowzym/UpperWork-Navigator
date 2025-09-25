export const providerPresets = {
  ChatGPT: {
    style: "präzise, sachlich",
    length: "mittel",
    creativity: "moderat"
  },
  Mistral: {
    style: "kompakt, stichpunktartig",
    length: "kurz",
    creativity: "niedrig"
  },
  Claude: {
    style: "ausführlich, gegliedert",
    length: "lang",
    creativity: "hoch"
  },
  Lokal: {
    style: "streng, faktenorientiert",
    length: "kurz",
    creativity: "0"
  },
  Custom: {
    style: "anpassbar",
    length: "variabel",
    creativity: "variabel"
  }
} as const;

export type ProviderPreset = typeof providerPresets[keyof typeof providerPresets];