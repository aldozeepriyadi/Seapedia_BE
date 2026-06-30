"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safePlainTextMessage = void 0;
exports.normalizePlainText = normalizePlainText;
exports.isSafePlainText = isSafePlainText;
const dangerousMarkupPattern = /<\s*\/?\s*[a-z][^>]*>|javascript\s*:|data\s*:\s*text\/html|on[a-z]+\s*=/i;
const controlCharactersPattern = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
exports.safePlainTextMessage = "Input tidak boleh berisi tag HTML, script, javascript URL, atau event handler.";
function normalizePlainText(value) {
    return value.replace(controlCharactersPattern, "").replace(/\s+/g, " ").trim();
}
function isSafePlainText(value) {
    return !dangerousMarkupPattern.test(value);
}
