import { describe, expect, it } from 'vitest';
import { SAMPLES } from '../data/samples';
import {
  allocationPercent,
  formatAmount,
  getToken,
  MAX_QUOTE_BYTES,
  parseQuote,
  routeStats,
  shortenAddress,
} from './quote';
import type { Quote } from './quote';

function fixture(): Quote {
  return structuredClone(SAMPLES[0].quote);
}

function parse(value: unknown): Quote {
  return parseQuote(JSON.stringify(value));
}

describe('parseQuote', () => {
  it('accepts each synthetic sample and a quoteResponse envelope', () => {
    for (const { quote } of SAMPLES) expect(parse(quote)).toEqual(quote);
    expect(parse({ quoteResponse: fixture() })).toEqual(fixture());
  });

  it('discards unrelated data instead of treating imported fields as token metadata or HTML', () => {
    const untrusted = {
      ...fixture(),
      tokenMetadata: { symbol: '<script>alert(1)</script>', decimals: 0 },
      __proto__: { malicious: true },
    };
    expect(parse(untrusted)).toEqual(fixture());
    expect(getToken(fixture().inputMint).decimals).toBe(9);
  });

  it.each(['', '{', 'null', '[]', 'true', '"quote"'])(
    'rejects invalid JSON/object input: %s',
    (input) => {
      expect(() => parseQuote(input)).toThrow(Error);
    },
  );

  it('bounds UTF-8 import size before parsing and caps route count', () => {
    expect(() => parseQuote('x'.repeat(MAX_QUOTE_BYTES + 1))).toThrow(
      /too large/,
    );
    expect(() => parseQuote('🪐'.repeat(MAX_QUOTE_BYTES / 4 + 1))).toThrow(
      /too large/,
    );
    const quote = fixture();
    quote.routePlan = Array.from({ length: 65 }, () =>
      structuredClone(quote.routePlan[0]),
    );
    expect(() => parse(quote)).toThrow(/64 route legs/);
    expect(() => parse({ ...fixture(), routePlan: [] })).toThrow(/routePlan/);
  });

  it.each([
    '-1',
    '1.5',
    '1e9',
    '01',
    '18446744073709551616',
    '9'.repeat(100),
    1000,
    null,
  ])('rejects malformed or overflowing amounts: %s', (inAmount) => {
    expect(() => parse({ ...fixture(), inAmount })).toThrow(/inAmount/);
  });

  it('retains 64-bit precision, accepts zero thresholds and rejects zero swap amounts', () => {
    expect(
      parse({ ...fixture(), inAmount: '18446744073709551615' }).inAmount,
    ).toBe('18446744073709551615');
    expect(
      parse({ ...fixture(), otherAmountThreshold: '0' }).otherAmountThreshold,
    ).toBe('0');
    expect(() => parse({ ...fixture(), inAmount: '0' })).toThrow(/positive/);
  });

  it.each(['not-a-mint', 'O'.repeat(44), 'z'.repeat(44), '1'.repeat(33)])(
    'rejects invalid base58 addresses and wrong byte lengths: %s',
    (inputMint) => {
      expect(() => parse({ ...fixture(), inputMint })).toThrow(/inputMint/);
    },
  );

  it.each([null, '', 'NaN', 'Infinity', '1e100', '100.0001', '-101', 0.02])(
    'rejects unbounded or non-string price impact: %s',
    (priceImpactPct) => {
      expect(() => parse({ ...fixture(), priceImpactPct })).toThrow(
        /priceImpactPct/,
      );
    },
  );

  it('accepts negative price impact and ExactOut quotes', () => {
    const result = parse({
      ...fixture(),
      priceImpactPct: '-0.2',
      swapMode: 'ExactOut',
      otherAmountThreshold: '1005000000',
    });
    expect(result.swapMode).toBe('ExactOut');
    expect(result.priceImpactPct).toBe('-0.2');
  });

  it('requires bounded finite numeric fields', () => {
    for (const value of [-1, 65_536, 0.5, '50', null]) {
      expect(() => parse({ ...fixture(), slippageBps: value })).toThrow(
        /slippageBps/,
      );
    }
    expect(() =>
      parse({ ...fixture(), contextSlot: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow(/contextSlot/);
    expect(() => parse({ ...fixture(), timeTaken: -1 })).toThrow(/timeTaken/);
    expect(() =>
      parseQuote(
        JSON.stringify(fixture()).replace(
          '"timeTaken":0.012',
          '"timeTaken":1e400',
        ),
      ),
    ).toThrow(/timeTaken/);
  });

  it('accepts the quote schema’s full unsigned 16-bit slippage range', () => {
    for (const slippageBps of [0, 10_001, 65_535]) {
      expect(parse({ ...fixture(), slippageBps }).slippageBps).toBe(
        slippageBps,
      );
    }
  });

  it('uses a safe fallback for an omitted venue label', () => {
    const quote = fixture();
    const swapInfo: Record<string, unknown> = {
      ...quote.routePlan[0].swapInfo,
    };
    delete swapInfo.label;
    const result = parse({
      ...quote,
      routePlan: [{ ...quote.routePlan[0], swapInfo }],
    });
    expect(result.routePlan[0].swapInfo.label).toBe('Unknown venue');
    expect(parse(result)).toEqual(result);
  });

  it.each([null, 42, {}, []])(
    'rejects a supplied invalid venue label: %s',
    (label) => {
      const quote = fixture();
      expect(() =>
        parse({
          ...quote,
          routePlan: [
            {
              ...quote.routePlan[0],
              swapInfo: { ...quote.routePlan[0].swapInfo, label },
            },
          ],
        }),
      ).toThrow(/label/);
    },
  );

  it('rejects control characters and excessive label lengths', () => {
    for (const label of [
      '',
      ' '.repeat(3),
      'a'.repeat(65),
      'DEX\nspoof',
      'DEX\u202espoof',
    ]) {
      const quote = fixture();
      quote.routePlan[0].swapInfo.label = label;
      expect(() => parse(quote)).toThrow(/label/);
    }
  });

  it('validates fee amounts and their mint together, including zero fees', () => {
    const quote = fixture();
    quote.routePlan[0].swapInfo.feeAmount = '0';
    expect(parse(quote).routePlan[0].swapInfo.feeAmount).toBe('0');
    quote.routePlan[0].swapInfo.feeAmount = '-1';
    expect(() => parse(quote)).toThrow(/feeAmount/);
    delete quote.routePlan[0].swapInfo.feeAmount;
    expect(() => parse(quote)).toThrow(/feeAmount/);
    delete quote.routePlan[0].swapInfo.feeMint;
    expect(parse(quote).routePlan[0].swapInfo.feeAmount).toBeUndefined();
  });

  it('supports tiny route allocations expressed in bps', () => {
    const quote = fixture();
    quote.routePlan[0].percent = 0;
    expect(() => parse(quote)).toThrow(/nonzero route allocation/);
    quote.routePlan[0].bps = 1;
    expect(parse(quote).routePlan[0].bps).toBe(1);
    quote.routePlan[0].bps = 10_001;
    expect(() => parse(quote)).toThrow(/bps/);
  });

  it.each([undefined, null])(
    'normalizes omitted or null legacy percentages from positive bps: %s',
    (percent) => {
      for (const bps of [1, 25, 3333, 10_000]) {
        const quote = fixture();
        const result = parse({
          ...quote,
          routePlan: [{ ...quote.routePlan[0], percent, bps }],
        });
        expect(result.routePlan[0].percent).toBe(Math.floor(bps / 100));
        expect(allocationPercent(result.routePlan[0])).toBe(bps / 100);
        expect(parse(result)).toEqual(result);
      }
    },
  );

  it.each([undefined, null])(
    'rejects an absent allocation and zero bps despite legacy percent: %s',
    (percent) => {
      const quote = fixture();
      expect(() =>
        parse({
          ...quote,
          routePlan: [{ ...quote.routePlan[0], percent }],
        }),
      ).toThrow(/percent or bps/);
      for (const legacyPercent of [percent, 100]) {
        expect(() =>
          parse({
            ...quote,
            routePlan: [
              { ...quote.routePlan[0], percent: legacyPercent, bps: 0 },
            ],
          }),
        ).toThrow(/nonzero route allocation/);
      }
    },
  );

  it.each([-1, 100.5, '100'])(
    'rejects invalid supplied percentages even when bps is present: %s',
    (percent) => {
      const quote = fixture();
      expect(() =>
        parse({
          ...quote,
          routePlan: [{ ...quote.routePlan[0], percent, bps: 10_000 }],
        }),
      ).toThrow(/percent/);
    },
  );

  it('validates intermediate legs without assuming each spends the full initial input', () => {
    const quote = structuredClone(SAMPLES[2].quote);
    expect(quote.routePlan[1].swapInfo.inAmount).not.toEqual(quote.inAmount);
    expect(parse(quote)).toEqual(quote);
  });

  it('rejects disconnected, dead-end, self-swap, and cyclic route graphs', () => {
    const disconnected = fixture();
    disconnected.routePlan[0].swapInfo.inputMint =
      SAMPLES[2].quote.routePlan[0].swapInfo.outputMint;
    expect(() => parse(disconnected)).toThrow(/connect/);
    const cycle = structuredClone(SAMPLES[2].quote);
    cycle.routePlan[1].swapInfo.outputMint = cycle.inputMint;
    expect(() => parse(cycle)).toThrow(/cycle/);
    const selfSwap = fixture();
    selfSwap.routePlan[0].swapInfo.outputMint = selfSwap.inputMint;
    expect(() => parse(selfSwap)).toThrow(/cycle/);
    const deadEnd = structuredClone(SAMPLES[1].quote);
    deadEnd.routePlan[1].swapInfo.outputMint =
      SAMPLES[2].quote.routePlan[0].swapInfo.outputMint;
    expect(() => parse(deadEnd)).toThrow(/connect/);
  });
});

describe('formatAmount', () => {
  it('never rounds a large integer through a floating point number', () => {
    expect(formatAmount('18446744073709551615', 6)).toBe(
      '18,446,744,073,709.551615',
    );
    expect(formatAmount('9007199254740993', 0)).toBe('9,007,199,254,740,993');
  });

  it('formats known decimal units and marks omitted nonzero digits', () => {
    expect(formatAmount('1000000000', 9)).toBe('1');
    expect(formatAmount('123456789', 9)).toBe('0.123456…');
    expect(formatAmount('1', 9, 9)).toBe('0.000000001');
    expect(formatAmount('1234000', 6, 2)).toBe('1.23…');
    expect(formatAmount('1230000', 6, 2)).toBe('1.23');
    expect(formatAmount('0', 9)).toBe('0');
    expect(formatAmount('999999', 6, 0)).toBe('0…');
  });

  it('leaves unknown token amounts in raw base units', () => {
    expect(formatAmount('9007199254740993', null)).toBe(
      '9,007,199,254,740,993 raw',
    );
    expect(getToken('11111111111111111111111111111112').decimals).toBeNull();
    expect(getToken('__proto__').decimals).toBeNull();
  });

  it('rejects invalid inputs and impossible display precision', () => {
    expect(() => formatAmount('1e9', 9)).toThrow();
    expect(() => formatAmount('100', -1)).toThrow();
    expect(() => formatAmount('100', 9, -1)).toThrow();
  });
});

describe('allocationPercent', () => {
  it('uses legacy percent when no basis-point allocation exists', () => {
    expect(allocationPercent(fixture().routePlan[0])).toBe(100);
  });

  it('retains subpercent and fractional-percent allocations from basis points', () => {
    const leg = fixture().routePlan[0];
    expect(allocationPercent({ ...leg, percent: 0, bps: 25 })).toBe(0.25);
    expect(allocationPercent({ ...leg, percent: 33, bps: 3333 })).toBe(33.33);
  });

  it('consistently prefers bps when the legacy field contradicts it', () => {
    const quote = fixture();
    quote.routePlan[0].percent = 100;
    quote.routePlan[0].bps = 1;
    expect(allocationPercent(parse(quote).routePlan[0])).toBe(0.01);
  });
});

describe('routeStats', () => {
  it('distinguishes direct, parallel split, and sequential multi-hop routes', () => {
    expect(routeStats(SAMPLES[0].quote)).toEqual({
      venues: 1,
      hops: 1,
      splits: 0,
    });
    expect(routeStats(SAMPLES[1].quote)).toEqual({
      venues: 2,
      hops: 1,
      splits: 1,
    });
    expect(routeStats(SAMPLES[2].quote)).toEqual({
      venues: 2,
      hops: 2,
      splits: 0,
    });
  });

  it('counts branching at an intermediate token and deduplicates venue labels', () => {
    const quote = structuredClone(SAMPLES[2].quote);
    quote.routePlan.push(structuredClone(quote.routePlan[1]));
    quote.routePlan[1].percent = 60;
    quote.routePlan[2].percent = 40;
    expect(routeStats(parse(quote))).toEqual({ venues: 2, hops: 2, splits: 1 });
  });

  it('uses token connectivity rather than the order of JSON route legs', () => {
    const quote = structuredClone(SAMPLES[2].quote);
    quote.routePlan.reverse();
    expect(routeStats(parse(quote))).toEqual({ venues: 2, hops: 2, splits: 0 });
  });
});

it('shortens long addresses without changing short strings', () => {
  expect(shortenAddress(SAMPLES[0].quote.inputMint)).toBe('So11…1112');
  expect(shortenAddress('SOL')).toBe('SOL');
});
