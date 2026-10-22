import { describe, expect, it } from 'vitest';
import { SAMPLES } from '../data/samples';
import type { Quote } from './quote';
import { boxesOverlap, layoutRoute } from './route-layout';

function quoteFor(edges: [string, string][]): Quote {
  const base = SAMPLES[0].quote;
  return {
    ...base,
    inputMint: edges[0][0],
    outputMint: edges[edges.length - 1][1],
    routePlan: edges.map(([inputMint, outputMint], index) => ({
      percent: 100,
      swapInfo: {
        ...base.routePlan[0].swapInfo,
        inputMint,
        outputMint,
        label: `Venue ${index}`,
      },
    })),
  };
}

function expectReadable(quote: Quote) {
  const layout = layoutRoute(quote);
  const boxes = [...layout.tokens, ...layout.legs];
  expect(layout.legs).toHaveLength(quote.routePlan.length);
  for (const [index, box] of boxes.entries()) {
    expect(Number.isFinite(box.x) && Number.isFinite(box.y)).toBe(true);
    expect(box.x - box.width / 2).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width / 2).toBeLessThanOrEqual(layout.width);
    expect(box.y - box.height / 2).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height / 2).toBeLessThanOrEqual(layout.height);
    for (const other of boxes.slice(index + 1)) {
      expect(boxesOverlap(box, other)).toBe(false);
    }
  }
  return layout;
}

describe('route layout', () => {
  it('keeps the simple demo layouts compact and every card visible', () => {
    for (const { quote } of SAMPLES) {
      const layout = expectReadable(quote);
      expect(layout.height).toBeLessThan(400);
    }
  });

  it('separates shortcut cards from a chain midpoint card and token', () => {
    const quote = quoteFor([
      ['A', 'B'],
      ['B', 'C'],
      ['C', 'D'],
      ['A', 'D'],
    ]);
    const layout = expectReadable(quote);
    expect(layout.legs[1].x).toBe(layout.legs[3].x);
    expect(layout.legs[1].y).not.toBe(layout.legs[3].y);
    expect(layoutRoute(quote)).toEqual(layout);
    expectReadable(
      quoteFor([
        ['A', 'D'],
        ['C', 'D'],
        ['B', 'C'],
        ['A', 'B'],
        ['B', 'D'],
      ]),
    );
  });

  it('supports the maximum 64 parallel legs without card overlap', () => {
    const layout = expectReadable(
      quoteFor(Array.from({ length: 64 }, () => ['A', 'B'])),
    );
    expect(layout.height).toBeLessThan(10_000);
  });

  it('supports a maximum-length chain without extra vertical space', () => {
    const layout = expectReadable(
      quoteFor(Array.from({ length: 64 }, (_, i) => [`T${i}`, `T${i + 1}`])),
    );
    expect(layout.tokens).toHaveLength(65);
    expect(layout.width).toBeLessThan(22_000);
    expect(layout.height).toBe(308);
  });

  it('keeps densely connected DAG tokens and venues separate', () => {
    const edges: [string, string][] = [];
    for (let from = 0; from < 10; from++) {
      for (let to = from + 1; to < 11; to++) {
        edges.push([`T${from}`, `T${to}`]);
      }
    }
    const layout = expectReadable(quoteFor(edges));
    expect(layout.height).toBeLessThan(10_000);
  });
});
