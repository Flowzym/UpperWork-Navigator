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

export const defaultEndpoints = {
  local: {
    baseUrl: import.meta.env.VITE_LOCAL_OPENAI_BASEURL || 'http://localhost:1234/v1',
    apiKey: import.meta.env.VITE_LOCAL_OPENAI_API_KEY || '',
  },
  custom: {
    baseUrl: import.meta.env.VITE_CUSTOM_OPENAI_BASEURL || 'https://api.openai.com/v1',
    apiKey: import.meta.env.VITE_CUSTOM_OPENAI_API_KEY || '',
  },
};