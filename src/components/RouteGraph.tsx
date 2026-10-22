import { ArrowUpRight, Layers2 } from 'lucide-react';
import {
  allocationPercent,
  formatAmount,
  getToken,
  shortenAddress,
  type Quote,
} from '../lib/quote';
import { TokenIcon } from './TokenIcon';
import { layoutRoute, TOKEN_SIZE, VENUE_SIZE } from '../lib/route-layout';

type Props = {
  quote: Quote;
  selectedLeg: number | null;
  onSelect: (index: number) => void;
};

export function RouteGraph({ quote, selectedLeg, onSelect }: Props) {
  const { width, height, tokens, legs } = layoutRoute(quote);
  const tokenByMint = new Map(tokens.map((token) => [token.mint, token]));

  return (
    <div
      className="graph-scroll"
      tabIndex={0}
      role="region"
      aria-label="Route diagram. Scroll to see longer or more complex routes. A text breakdown follows below."
      style={{ maxHeight: 620, overflow: 'auto' }}
    >
      <div
        className="route-graph"
        style={{ width, minWidth: width, height, marginInline: 'auto' }}
      >
        <svg
          className="graph-lines"
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
        >
          {legs.map(({ index, x: cx, y: cy }) => {
            const leg = quote.routePlan[index].swapInfo;
            const source = tokenByMint.get(leg.inputMint)!;
            const target = tokenByMint.get(leg.outputMint)!;
            const sx = source.x + TOKEN_SIZE.width / 2,
              sy = source.y;
            const ex = target.x - TOKEN_SIZE.width / 2,
              ey = target.y;
            return (
              <g
                key={index}
                className={selectedLeg === index ? 'selected' : ''}
              >
                <path
                  d={`M ${sx} ${sy} C ${sx + 48} ${sy}, ${cx - 110} ${cy}, ${cx - 77} ${cy}`}
                />
                <path
                  d={`M ${cx + 77} ${cy} C ${cx + 110} ${cy}, ${ex - 48} ${ey}, ${ex} ${ey}`}
                />
                <circle cx={ex} cy={ey} r="3" />
              </g>
            );
          })}
        </svg>
        {tokens.map(({ mint, x, y }) => {
          const token = getToken(mint);
          const input = mint === quote.inputMint;
          const output = mint === quote.outputMint;
          return (
            <div
              className={`graph-token ${output ? 'output' : ''}`}
              key={mint}
              style={{ left: x, top: y, height: TOKEN_SIZE.height }}
            >
              <span className="graph-token-label">
                {input ? 'INPUT' : output ? 'OUTPUT' : 'VIA'}
              </span>
              <TokenIcon mint={mint} />
              <strong title={mint}>{token.symbol}</strong>
              <span className="mono">
                {input
                  ? formatAmount(quote.inAmount, token.decimals, 4)
                  : output
                    ? formatAmount(quote.outAmount, token.decimals, 4)
                    : 'Intermediate'}
              </span>
            </div>
          );
        })}
        {legs.map(({ index, x, y }) => {
          const route = quote.routePlan[index];
          const leg = route.swapInfo;
          return (
            <button
              key={index}
              className={`venue-node ${selectedLeg === index ? 'active' : ''}`}
              style={{ left: x, top: y, height: VENUE_SIZE.height }}
              onClick={() => onSelect(index)}
              aria-pressed={selectedLeg === index}
              aria-label={`Inspect leg ${index + 1}: ${leg.label}`}
            >
              <span className="venue-top">
                <span className="venue-mark">
                  <Layers2 size={13} />
                </span>
                <span className="allocation">{allocationPercent(route)}%</span>
              </span>
              <strong>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={leg.label}
                >
                  {leg.label}
                </span>
                <ArrowUpRight size={12} />
              </strong>
              <span>
                {getToken(leg.inputMint).symbol}
                <span className="route-arrow">→</span>
                {getToken(leg.outputMint).symbol}
              </span>
              <span className="sr-only">Pool {shortenAddress(leg.ammKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
