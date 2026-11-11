import type { CSSProperties } from 'react';

/**
 * Props for a list body (`<TableBody>`, or the element whose children are the rows) that
 * stripes every other row with `stripeColor` (`.list-zebra` in src/app/globals.css).
 * No color = no stripes.
 */
export function zebraBodyProps(stripeColor: string | null | undefined): {
  className?: string;
  style?: CSSProperties;
  'data-zebra'?: string;
} {
  if (!stripeColor) return {};
  return {
    className: 'list-zebra',
    style: { '--list-stripe': stripeColor } as CSSProperties,
    'data-zebra': stripeColor,
  };
}
