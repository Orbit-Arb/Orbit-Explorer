/** Browser-only quote decoding. Imported data is never fetched, executed, or trusted as metadata. */
export type Quote = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: 'ExactIn' | 'ExactOut';
  slippageBps: number;
  priceImpactPct: string;
  routePlan: {
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount?: string;
      feeMint?: string;
    };
    percent: number;
    bps?: number;
  }[];
  contextSlot?: number;
  timeTaken?: number;
};

export const MAX_QUOTE_BYTES = 1_048_576;
const MAX_AMOUNT = 18_446_744_073_709_551_615n;
const BASE58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function fail(message: string): never {
  throw new Error(message);
}

function object(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    fail(`${path} must be a JSON object.`);
  }
  return value as Record<string, unknown>;
}

function address(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length < 32 || value.length > 44) {
    fail(`${path} must be a valid Solana address.`);
  }
  let decoded = 0n;
  for (const char of value) {
    const digit = BASE58.indexOf(char);
    if (digit < 0) fail(`${path} must be a valid Solana address.`);
    decoded = decoded * 58n + BigInt(digit);
  }
  let bytes = 0;
  while (decoded > 0n) {
    decoded >>= 8n;
    bytes += 1;
  }
  const leadingZeros = value.match(/^1*/)?.[0].length ?? 0;
  if (bytes + leadingZeros !== 32)
    fail(`${path} must decode to a 32-byte Solana address.`);
  return value;
}

function amount(value: unknown, path: string, allowZero = false): string {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,19})$/.test(value)) {
    fail(`${path} must be an unsigned integer string in base units.`);
  }
  const parsed = BigInt(value);
  if (parsed > MAX_AMOUNT || (!allowZero && parsed === 0n)) {
    fail(
      `${path} must be ${allowZero ? 'a nonnegative' : 'a positive'} 64-bit token amount.`,
    );
  }
  return value;
}

function number(
  value: unknown,
  path: string,
  max: number,
  integer = false,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > max ||
    (integer && !Number.isSafeInteger(value))
  ) {
    fail(
      `${path} must be a ${integer ? 'whole ' : ''}number between 0 and ${max}.`,
    );
  }
  return value;
}

function label(value: unknown, path: string): string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    value.length > 64 ||
    /[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(value)
  ) {
    fail(`${path} must be a readable label of 1–64 characters.`);
  }
  return value.trim();
}

function validateGraph(quote: Quote): void {
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const { swapInfo } of quote.routePlan) {
    outgoing.set(swapInfo.inputMint, [
      ...(outgoing.get(swapInfo.inputMint) ?? []),
      swapInfo.outputMint,
    ]);
    incoming.set(swapInfo.outputMint, [
      ...(incoming.get(swapInfo.outputMint) ?? []),
      swapInfo.inputMint,
    ]);
  }
  const active = new Set<string>();
  const visited = new Set<string>();
  function visit(mint: string): void {
    if (active.has(mint))
      fail(
        'This quote contains a route cycle. Only acyclic swap routes are supported.',
      );
    if (visited.has(mint)) return;
    active.add(mint);
    for (const next of outgoing.get(mint) ?? []) visit(next);
    active.delete(mint);
    visited.add(mint);
  }
  visit(quote.inputMint);
  const reachesOutput = new Set<string>();
  function reverseVisit(mint: string): void {
    if (reachesOutput.has(mint)) return;
    reachesOutput.add(mint);
    for (const previous of incoming.get(mint) ?? []) reverseVisit(previous);
  }
  reverseVisit(quote.outputMint);
  for (const { swapInfo } of quote.routePlan) {
    if (
      !visited.has(swapInfo.inputMint) ||
      !reachesOutput.has(swapInfo.outputMint)
    ) {
      fail(
        'Every route leg must connect the quote’s input token to its output token.',
      );
    }
  }
  if (quote.inputMint === quote.outputMint || !visited.has(quote.outputMint)) {
    fail('The route must connect two different input and output tokens.');
  }
}

/** Accepts a legacy Metis quote, or an object containing quoteResponse. Unknown keys are discarded. */
export function parseQuote(text: string): Quote {
  if (
    text.length > MAX_QUOTE_BYTES ||
    new TextEncoder().encode(text).length > MAX_QUOTE_BYTES
  ) {
    fail('This quote is too large. Import a JSON file smaller than 1 MiB.');
  }
  let decoded: unknown;
  try {
    decoded = JSON.parse(text);
  } catch {
    fail(
      'This is not valid JSON. Paste a complete Metis / Jupiter quote response.',
    );
  }
  const envelope = object(decoded, 'Quote');
  const raw = object(
    Object.hasOwn(envelope, 'quoteResponse')
      ? envelope.quoteResponse
      : envelope,
    'Quote',
  );
  if (raw.swapMode !== 'ExactIn' && raw.swapMode !== 'ExactOut') {
    fail('swapMode must be ExactIn or ExactOut.');
  }
  if (
    typeof raw.priceImpactPct !== 'string' ||
    !/^-?\d{1,6}(\.\d{1,20})?$/.test(raw.priceImpactPct) ||
    !Number.isFinite(Number(raw.priceImpactPct)) ||
    Math.abs(Number(raw.priceImpactPct)) > 100
  ) {
    fail('priceImpactPct must be a decimal string between -100 and 100.');
  }
  if (
    !Array.isArray(raw.routePlan) ||
    raw.routePlan.length < 1 ||
    raw.routePlan.length > 64
  ) {
    fail('routePlan must contain between 1 and 64 route legs.');
  }
  const quote: Quote = {
    inputMint: address(raw.inputMint, 'inputMint'),
    outputMint: address(raw.outputMint, 'outputMint'),
    inAmount: amount(raw.inAmount, 'inAmount'),
    outAmount: amount(raw.outAmount, 'outAmount'),
    otherAmountThreshold: amount(
      raw.otherAmountThreshold,
      'otherAmountThreshold',
      true,
    ),
    swapMode: raw.swapMode,
    slippageBps: number(raw.slippageBps, 'slippageBps', 65_535, true),
    priceImpactPct: raw.priceImpactPct,
    routePlan: raw.routePlan.map((entry, index) => {
      const path = `routePlan[${index}]`;
      const leg = object(entry, path);
      const info = object(leg.swapInfo, `${path}.swapInfo`);
      const swapInfo: Quote['routePlan'][number]['swapInfo'] = {
        ammKey: address(info.ammKey, `${path}.ammKey`),
        label:
          info.label === undefined
            ? 'Unknown venue'
            : label(info.label, `${path}.label`),
        inputMint: address(info.inputMint, `${path}.inputMint`),
        outputMint: address(info.outputMint, `${path}.outputMint`),
        inAmount: amount(info.inAmount, `${path}.inAmount`),
        outAmount: amount(info.outAmount, `${path}.outAmount`),
      };
      if (info.feeAmount !== undefined || info.feeMint !== undefined) {
        swapInfo.feeAmount = amount(info.feeAmount, `${path}.feeAmount`, true);
        swapInfo.feeMint = address(info.feeMint, `${path}.feeMint`);
      }
      const bps =
        leg.bps === undefined
          ? undefined
          : number(leg.bps, `${path}.bps`, 10_000, true);
      if (leg.percent == null && bps === undefined) {
        fail(`${path} must include a percent or bps route allocation.`);
      }
      // Modern /quote responses can omit or null the legacy percent field.
      // Keep its normalized fallback integral so exported quotes re-import;
      // allocationPercent preserves the authoritative basis-point precision.
      const percent =
        leg.percent == null
          ? Math.floor(bps! / 100)
          : number(leg.percent, `${path}.percent`, 100, true);
      if ((bps ?? percent) === 0)
        fail(`${path} must have a nonzero route allocation.`);
      return { swapInfo, percent, ...(bps === undefined ? {} : { bps }) };
    }),
  };
  if (raw.contextSlot !== undefined) {
    quote.contextSlot = number(
      raw.contextSlot,
      'contextSlot',
      Number.MAX_SAFE_INTEGER,
      true,
    );
  }
  if (raw.timeTaken !== undefined)
    quote.timeTaken = number(raw.timeTaken, 'timeTaken', 86_400);
  validateGraph(quote);
  return quote;
}

function groupDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** Never converts token amounts to Number. An ellipsis explicitly marks omitted nonzero digits. */
export function formatAmount(
  value: string,
  decimals: number | null,
  maxDecimals = 6,
): string {
  if (!/^\d{1,100}$/.test(value))
    throw new Error('Amount must be a positive integer string.');
  const normalized = value.replace(/^0+(?=\d)/, '');
  if (decimals === null) return `${groupDigits(normalized)} raw`;
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 255)
    throw new Error('Invalid token decimals.');
  if (!Number.isInteger(maxDecimals) || maxDecimals < 0 || maxDecimals > 255) {
    throw new Error('Invalid display precision.');
  }
  const padded = normalized.padStart(decimals + 1, '0');
  const whole = decimals === 0 ? padded : padded.slice(0, -decimals);
  const fraction = decimals === 0 ? '' : padded.slice(-decimals);
  const visible = fraction.slice(0, maxDecimals).replace(/0+$/, '');
  const omitted = /[1-9]/.test(fraction.slice(maxDecimals));
  return `${groupDigits(whole)}${visible ? `.${visible}` : ''}${omitted ? '…' : ''}`;
}

type Token = {
  mint: string;
  symbol: string;
  name: string;
  decimals: number | null;
  tone: string;
};
const TOKENS: Record<string, Omit<Token, 'mint'>> = {
  So11111111111111111111111111111111111111112: {
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    tone: 'purple',
  },
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    tone: 'blue',
  },
  JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN: {
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    tone: 'green',
  },
};

export function shortenAddress(value: string): string {
  return value.length > 12 ? `${value.slice(0, 4)}…${value.slice(-4)}` : value;
}

export function getToken(mint: string): Token {
  return {
    mint,
    ...(Object.hasOwn(TOKENS, mint)
      ? TOKENS[mint]
      : {
          symbol: shortenAddress(mint),
          name: 'Unknown token',
          decimals: null,
          tone: 'neutral',
        }),
  };
}

/** Basis points are authoritative when both legacy allocation fields are present. */
export function allocationPercent(leg: Quote['routePlan'][number]): number {
  return leg.bps === undefined ? leg.percent : leg.bps / 100;
}

/** Hops are the longest path; splits count extra outgoing branches, including parallel pools. */
export function routeStats(quote: Quote): {
  venues: number;
  hops: number;
  splits: number;
} {
  const outgoing = new Map<string, string[]>();
  for (const { swapInfo } of quote.routePlan) {
    outgoing.set(swapInfo.inputMint, [
      ...(outgoing.get(swapInfo.inputMint) ?? []),
      swapInfo.outputMint,
    ]);
  }
  const memo = new Map<string, number>();
  function depth(mint: string): number {
    if (mint === quote.outputMint) return 0;
    const cached = memo.get(mint);
    if (cached !== undefined) return cached;
    // parseQuote validates acyclicity before an untrusted quote reaches this function.
    const result = 1 + Math.max(0, ...(outgoing.get(mint) ?? []).map(depth));
    memo.set(mint, result);
    return result;
  }
  return {
    venues: new Set(quote.routePlan.map(({ swapInfo }) => swapInfo.label)).size,
    hops: depth(quote.inputMint),
    splits: [...outgoing.values()].reduce(
      (sum, branches) => sum + Math.max(0, branches.length - 1),
      0,
    ),
  };
}
