/** jsdom gaps the real ui-conversation assembly touches (mirrors the core's own test setup). */
if (typeof document !== 'undefined' && !('fonts' in document)) {
  Object.defineProperty(document, 'fonts', { configurable: true, value: new EventTarget() })
}
