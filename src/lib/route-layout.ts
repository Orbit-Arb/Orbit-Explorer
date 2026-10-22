import type { Quote } from './quote';

export const TOKEN_SIZE = { width: 128, height: 180 };
export const VENUE_SIZE = { width: 154, height: 128 };
const GAP = 16;
const PADDING = 20;

export type LayoutBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function boxesOverlap(a: LayoutBox, b: LayoutBox, gap = 0): boolean {
  return (
    Math.abs(a.x - b.x) < (a.width + b.width) / 2 + gap &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2 + gap
  );
}

/** Deterministic, bounded layout for the connected DAG accepted by parseQuote. */
export function layoutRoute(quote: Quote) {
  const mints = [
    ...new Set([
      quote.inputMint,
      ...quote.routePlan.flatMap(({ swapInfo }) => [
        swapInfo.inputMint,
        swapInfo.outputMint,
      ]),
      quote.outputMint,
    ]),
  ];
  const incoming = new Map<string, string[]>();
  for (const { swapInfo } of quote.routePlan) {
    incoming.set(swapInfo.outputMint, [
      ...(incoming.get(swapInfo.outputMint) ?? []),
      swapInfo.inputMint,
    ]);
  }
  const levels = new Map<string, number>([[quote.inputMint, 0]]);
  function depth(mint: string): number {
    const cached = levels.get(mint);
    if (cached !== undefined) return cached;
    const level = 1 + Math.max(...(incoming.get(mint) ?? []).map(depth));
    levels.set(mint, level);
    return level;
  }
  mints.forEach(depth);
  const lastLevel = Math.max(1, ...levels.values());
  const width = Math.max(780, lastLevel * 340 + 184);
  const columns = Array.from({ length: lastLevel + 1 }, (_, level) =>
    mints.filter((mint) => levels.get(mint) === level).sort(),
  );
  const parallelCounts = new Map<string, number>();
  const pairKey = (input: string, output: string) => `${input}:${output}`;
  for (const { swapInfo } of quote.routePlan) {
    const key = pairKey(swapInfo.inputMint, swapInfo.outputMint);
    parallelCounts.set(key, (parallelCounts.get(key) ?? 0) + 1);
  }
  const initialHeight = Math.max(
    308,
    Math.max(...columns.map((column) => column.length)) *
      (TOKEN_SIZE.height + GAP) +
      PADDING * 2,
    Math.max(...parallelCounts.values()) * (VENUE_SIZE.height + GAP) +
      PADDING * 2,
  );
  const tokens = mints.map((mint) => {
    const column = columns[levels.get(mint)!];
    return {
      mint,
      x: 92 + (levels.get(mint)! / lastLevel) * (width - 184),
      y:
        initialHeight / 2 +
        (column.indexOf(mint) - (column.length - 1) / 2) *
          (TOKEN_SIZE.height + GAP),
      ...TOKEN_SIZE,
    };
  });
  const tokenByMint = new Map(tokens.map((token) => [token.mint, token]));
  const occupied: LayoutBox[] = [...tokens];
  const parallelIndex = new Map<string, number>();
  const legs = quote.routePlan.map(({ swapInfo }, index) => {
    const source = tokenByMint.get(swapInfo.inputMint)!;
    const target = tokenByMint.get(swapInfo.outputMint)!;
    const key = pairKey(swapInfo.inputMint, swapInfo.outputMint);
    const ordinal = parallelIndex.get(key) ?? 0;
    parallelIndex.set(key, ordinal + 1);
    const x = (source.x + target.x) / 2;
    const desiredY =
      (source.y + target.y) / 2 +
      (ordinal - (parallelCounts.get(key)! - 1) / 2) *
        (VENUE_SIZE.height + GAP);
    const minimumY = PADDING + VENUE_SIZE.height / 2;
    // Every blocked interval supplies its two nearest free boundaries. Testing
    // those boundaries finds a free slot without an iterative search or cap.
    const obstacles = occupied.filter(
      (box) => Math.abs(box.x - x) < (box.width + VENUE_SIZE.width) / 2 + GAP,
    );
    const candidates = [
      Math.max(minimumY, desiredY),
      minimumY,
      ...obstacles.flatMap((box) => [
        box.y - (box.height + VENUE_SIZE.height) / 2 - GAP,
        box.y + (box.height + VENUE_SIZE.height) / 2 + GAP,
      ]),
    ]
      .filter((y) => y >= minimumY)
      .sort((a, b) => Math.abs(a - desiredY) - Math.abs(b - desiredY) || a - b);
    const y = candidates.find((candidate) =>
      obstacles.every(
        (box) => !boxesOverlap({ x, y: candidate, ...VENUE_SIZE }, box, GAP),
      ),
    )!;
    const position = { index, x, y, ...VENUE_SIZE };
    occupied.push(position);
    return position;
  });
  const height = Math.max(
    initialHeight,
    ...occupied.map((box) => box.y + box.height / 2 + PADDING),
  );
  return { width, height, tokens, legs };
}
