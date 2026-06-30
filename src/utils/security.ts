const dangerousMarkupPattern =
  /<\s*\/?\s*[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|on[a-z]+\s*=/i;

const controlCharactersPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export const safePlainTextMessage =
  "Input tidak boleh berisi tag HTML, script, javascript URL, atau event handler.";

export function normalizePlainText(value: string) {
  return value.replace(controlCharactersPattern, "").replace(/\s+/g, " ").trim();
}

export function isSafePlainText(value: string) {
  return !dangerousMarkupPattern.test(value);
}
