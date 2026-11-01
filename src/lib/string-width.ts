// Firefox 114–124 needs a Segmenter polyfill before the width library loads.
import 'unicode-segmenter/intl-polyfill';
import { StringWidth } from '@cto.af/string-width';

// Keep ambiguous characters narrow regardless of the browser's locale.
const calculator = new StringWidth({ isCJK: false });

export function getStringWidth(text: string): number {
  // Halfwidth voiced marks occupy a column even when grouped with a kana.
  return calculator.width(text.replace(/[\uFF9E\uFF9F]/g, ' '));
}
