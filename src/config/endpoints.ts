export interface EndpointConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
}

export const defaultEndpoints = {
  local: {
    baseUrl: import.meta.env.VITE_LOCAL_OPENAI_BASEURL || 'http://localhost:11434/v1',
    model: import.meta.env.VITE_LOCAL_OPENAI_MODEL || 'llama3.1:8b-instruct',
    apiKey: import.meta.env.VITE_LOCAL_OPENAI_API_KEY || undefined
  },
  custom: {
    baseUrl: import.meta.env.VITE_CUSTOM_OPENAI_BASEURL || 'https://api.openai.com/v1',
    model: import.meta.env.VITE_CUSTOM_OPENAI_MODEL || 'gpt-3.5-turbo',
    apiKey: import.meta.env.VITE_CUSTOM_OPENAI_API_KEY || undefined
  }
};

export const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.replace(/\/$/, '');
};

export const buildChatCompletionsUrl = (baseUrl: string): string => {
  return `${normalizeBaseUrl(baseUrl)}/chat/completions`;
};

export const buildModelsUrl = (baseUrl: string): string => {
  return `${normalizeBaseUrl(baseUrl)}/models`;
};

export const createRequestHeaders = (apiKey?: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }
  
  return headers;
};

export const createAbortController = (timeoutMs: number = 12000): AbortController => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
};