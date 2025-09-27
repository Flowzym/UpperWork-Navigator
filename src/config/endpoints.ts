export type EndpointConfig = {
  baseUrl: string; // ohne trailing slash ok
  apiKey?: string;
};

export const buildChatCompletionsUrl = (base: string) =>
  `${base.replace(/\/$/, '')}/chat/completions`;

export const buildModelsUrl = (base: string) =>
  `${base.replace(/\/$/, '')}/models`;

export const buildRequestHeaders = (apiKey?: string) => ({
  'Content-Type': 'application/json',
  ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
});

export const createAbortController = (timeoutMs = 20000) => {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), timeoutMs);
  // @ts-expect-error attach for cleanup
  c.__timeout = t;
  return c as AbortController & { __timeout?: any };
};