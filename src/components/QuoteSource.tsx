import {
  ArrowDown,
  ArrowRight,
  GitBranch,
  Layers2,
  Plus,
  ScanLine,
} from 'lucide-react';
import { SAMPLES } from '../data/samples';
import { formatAmount, getToken, type Quote } from '../lib/quote';
import type { Source } from '../types';
import { TokenIcon } from './TokenIcon';

const SAMPLE_DESCRIPTIONS: Record<string, string> = {
  direct: 'One venue, one hop',
  split: 'Two venues, shared liquidity',
  multihop: 'Via an intermediate token',
};

type QuoteSourceProps = {
  quote: Quote;
  source: Source;
  onLoadQuote: (quote: Quote, source: Source) => void;
  onImport: () => void;
};

export function QuoteSource({
  quote,
  source,
  onLoadQuote,
  onImport,
}: QuoteSourceProps) {
  const input = getToken(quote.inputMint);
  const output = getToken(quote.outputMint);
  return (
    <aside className="quote-column" aria-label="Quote source and amounts">
      <section className="panel quote-source">
        <div className="panel-title">
          <h2>Start exploring</h2>
          <span className="step-label">01</span>
        </div>
        <p className="section-description">Pick a route. See what’s inside.</p>
        <div className="source-label">
          SAMPLE ROUTES<span className="mini-badge">DEMO</span>
        </div>
        <div className="sample-list" role="group" aria-label="Sample routes">
          {SAMPLES.map((sample, index) => (
            <button
              key={sample.id}
              className={`sample-option ${source.kind === 'sample' && source.id === sample.id ? 'selected' : ''}`}
              onClick={() =>
                onLoadQuote(sample.quote, {
                  kind: 'sample',
                  id: sample.id,
                })
              }
              aria-pressed={source.kind === 'sample' && source.id === sample.id}
            >
              <span className="sample-icon">
                {index === 0 ? (
                  <ArrowRight size={17} />
                ) : index === 1 ? (
                  <GitBranch size={17} />
                ) : (
                  <Layers2 size={17} />
                )}
              </span>
              <span>
                <strong>{sample.title}</strong>
                <small>{SAMPLE_DESCRIPTIONS[sample.id]}</small>
              </span>
              <span className="radio-indicator">
                {source.kind === 'sample' && source.id === sample.id && (
                  <span />
                )}
              </span>
            </button>
          ))}
        </div>
        <div className="or-divider">
          <span />
          or bring your own
          <span />
        </div>
        <button className="button import-source" onClick={onImport}>
          <Plus size={15} />
          Import quote JSON
        </button>
      </section>
      <section className="panel amount-panel">
        <div className="panel-title">
          <h2>The swap</h2>
          <span
            className={`source-chip ${source.kind === 'import' ? 'imported' : ''}`}
          >
            {source.kind === 'sample' ? 'Sample' : 'Imported'}
          </span>
        </div>
        <div className="amount-card">
          <span className="field-label">INPUT AMOUNT</span>
          <div className="amount-main">
            <strong className="mono">
              {formatAmount(quote.inAmount, input.decimals, 6)}
            </strong>
            <TokenIcon mint={quote.inputMint} small />
          </div>
          <div className="amount-token">
            <span title={quote.inputMint}>{input.symbol}</span>
            <span>{input.name}</span>
          </div>
        </div>
        <div className="amount-direction">
          <ArrowDown size={14} />
        </div>
        <div className="amount-card output-card">
          <span className="field-label">EXPECTED OUTPUT</span>
          <div className="amount-main">
            <strong className="mono">
              {formatAmount(quote.outAmount, output.decimals, 6)}
            </strong>
            <TokenIcon mint={quote.outputMint} small />
          </div>
          <div className="amount-token">
            <span title={quote.outputMint}>{output.symbol}</span>
            <span>{output.name}</span>
          </div>
        </div>
        <div className="swap-info">
          <span>Swap mode</span>
          <strong>
            {quote.swapMode === 'ExactIn' ? 'Exact input' : 'Exact output'}
          </strong>
        </div>
        <div className="swap-info">
          <span>Slippage tolerance</span>
          <strong>
            {quote.slippageBps / 100}%{' '}
            <span className="muted">/ {quote.slippageBps} bps</span>
          </strong>
        </div>
      </section>
      <div className="local-note">
        <ScanLine size={17} />
        <p>
          {source.kind === 'sample'
            ? 'Synthetic data. Made for exploring, not a live market quote.'
            : 'Imported snapshot. No freshness or execution checks are performed.'}
        </p>
      </div>
    </aside>
  );
}
