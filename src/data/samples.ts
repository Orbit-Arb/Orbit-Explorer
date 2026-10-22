import type { Quote } from '../lib/quote';

// These quotes, pool identifiers, timings, and allocations are fictional educational fixtures.
// Known public token mints identify units only; no live prices or Orbit activity are included.
const SOL = 'So11111111111111111111111111111111111111112';
const USDC = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const JUP = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
const POOL_A = '11111111111111111111111111111112';
const POOL_B = '11111111111111111111111111111113';

const base = {
  inputMint: SOL,
  outputMint: USDC,
  inAmount: '1000000000',
  outAmount: '150000000',
  otherAmountThreshold: '149250000',
  swapMode: 'ExactIn' as const,
  slippageBps: 50,
  priceImpactPct: '0.02',
  contextSlot: 123456789,
  timeTaken: 0.012,
};

export const SAMPLES: {
  id: string;
  title: string;
  description: string;
  quote: Quote;
}[] = [
  {
    id: 'direct',
    title: 'Direct route',
    description: 'One swap, one venue. A fictional SOL → USDC quote.',
    quote: {
      ...base,
      routePlan: [
        {
          swapInfo: {
            ammKey: POOL_A,
            label: 'Orca',
            inputMint: SOL,
            outputMint: USDC,
            inAmount: '1000000000',
            outAmount: '150000000',
            feeAmount: '3000000',
            feeMint: SOL,
          },
          percent: 100,
        },
      ],
    },
  },
  {
    id: 'split',
    title: 'Split route',
    description: 'A fictional quote split across two venues: 60% / 40%.',
    quote: {
      ...base,
      outAmount: '150300000',
      otherAmountThreshold: '149548500',
      priceImpactPct: '0.015',
      timeTaken: 0.018,
      routePlan: [
        {
          swapInfo: {
            ammKey: POOL_A,
            label: 'Orca',
            inputMint: SOL,
            outputMint: USDC,
            inAmount: '600000000',
            outAmount: '90200000',
            feeAmount: '1800000',
            feeMint: SOL,
          },
          percent: 60,
        },
        {
          swapInfo: {
            ammKey: POOL_B,
            label: 'Raydium',
            inputMint: SOL,
            outputMint: USDC,
            inAmount: '400000000',
            outAmount: '60100000',
            feeAmount: '1000000',
            feeMint: SOL,
          },
          percent: 40,
        },
      ],
    },
  },
  {
    id: 'multihop',
    title: 'Multi-hop route',
    description:
      'A fictional SOL → JUP → USDC path through an intermediate token.',
    quote: {
      ...base,
      outAmount: '150120000',
      otherAmountThreshold: '149369400',
      priceImpactPct: '0.025',
      timeTaken: 0.024,
      routePlan: [
        {
          swapInfo: {
            ammKey: POOL_A,
            label: 'Orca',
            inputMint: SOL,
            outputMint: JUP,
            inAmount: '1000000000',
            outAmount: '300000000',
            feeAmount: '3000000',
            feeMint: SOL,
          },
          percent: 100,
        },
        {
          swapInfo: {
            ammKey: POOL_B,
            label: 'Meteora',
            inputMint: JUP,
            outputMint: USDC,
            inAmount: '300000000',
            outAmount: '150120000',
            feeAmount: '600000',
            feeMint: JUP,
          },
          percent: 100,
        },
      ],
    },
  },
];
