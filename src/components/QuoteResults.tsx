import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Code2,
  Copy,
  GitBranch,
  Info,
  Layers2,
  Network,
} from 'lucide-react';
import {
  allocationPercent,
  formatAmount,
  getToken,
  routeStats,
  type Quote,
} from '../lib/quote';
import type { Source, ViewTab } from '../types';
import { RouteGraph } from './RouteGraph';

type QuoteResultsProps = {
  quote: Quote;
  source: Source;
  tab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  selectedLeg: number | null;
  onSelectLeg: (index: number | null) => void;
  json: string;
  onDownload: () => void;
  onCopy: () => void;
};

export function QuoteResults({
  quote,
  source,
  tab,
  onTabChange,
  selectedLeg,
  onSelectLeg,
  json,
  onDownload,
  onCopy,
}: QuoteResultsProps) {
  const input = getToken(quote.inputMint);
  const output = getToken(quote.outputMint);
  const stats = routeStats(quote);
  const hasUnknownVenue = quote.routePlan.some(
    ({ swapInfo }) => swapInfo.label === 'Unknown venue',
  );
  const activeLeg =
    selectedLeg === null ? undefined : quote.routePlan[selectedLeg];
  return (
    <div className="results-column">
      <div className="metrics-grid">
        <div className="metric">
          <span>
            Liquidity venues <Layers2 size={13} />
          </span>
          <strong className="mono">
            {hasUnknownVenue ? '—' : String(stats.venues).padStart(2, '0')}
          </strong>
          <small>
            {hasUnknownVenue ? 'Some labels unavailable' : 'Across this route'}
          </small>
        </div>
        <div className="metric">
          <span>
            Maximum hops <GitBranch size={13} />
          </span>
          <strong className="mono">
            {String(stats.hops).padStart(2, '0')}
          </strong>
          <small>
            {stats.hops === 1
              ? 'Direct to destination'
              : 'Via intermediate tokens'}
          </small>
        </div>
        <div className="metric">
          <span>
            Price impact <Info size={13} />
          </span>
          <strong className="mono accent">
            {quote.priceImpactPct}
            <span className="metric-unit">%</span>
          </strong>
          <small>As reported by provider</small>
        </div>
      </div>
      <section className="panel route-panel">
        <div className="route-panel-heading">
          <div>
            <h2>Route overview</h2>
            <p>
              {input.symbol}
              <ArrowRight size={12} />
              {output.symbol}
              <span className="heading-separator">/</span>
              {quote.routePlan.length}{' '}
              {quote.routePlan.length === 1 ? 'leg' : 'legs'}
              <span className="heading-separator">/</span>
              {stats.splits ? 'Split routing' : 'Single path'}
            </p>
          </div>
          <div
            className={`provenance ${source.kind === 'import' ? 'imported' : ''}`}
          >
            <span className="status-dot" />
            {source.kind === 'sample'
              ? 'Synthetic example'
              : 'Imported · local only'}
          </div>
        </div>
        <div className="route-toolbar">
          <div
            className="segmented-control"
            role="tablist"
            aria-label="Route view"
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                const next = tab === 'diagram' ? 'json' : 'diagram';
                onTabChange(next);
                document.getElementById(`tab-${next}`)?.focus();
              }
            }}
          >
            <button
              id="tab-diagram"
              role="tab"
              aria-selected={tab === 'diagram'}
              aria-controls="route-view"
              tabIndex={tab === 'diagram' ? 0 : -1}
              className={tab === 'diagram' ? 'active' : ''}
              onClick={() => onTabChange('diagram')}
            >
              <Network size={14} />
              Diagram
            </button>
            <button
              id="tab-json"
              role="tab"
              aria-selected={tab === 'json'}
              aria-controls="route-view"
              tabIndex={tab === 'json' ? 0 : -1}
              className={tab === 'json' ? 'active' : ''}
              onClick={() => onTabChange('json')}
            >
              <Code2 size={14} />
              JSON
            </button>
          </div>
          <button
            className="icon-button"
            aria-label="Download quote JSON"
            title="Download quote JSON"
            onClick={onDownload}
          >
            <ArrowDownToLine size={16} />
          </button>
        </div>
        <div
          id="route-view"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          tabIndex={0}
        >
          {tab === 'diagram' ? (
            <RouteGraph
              quote={quote}
              selectedLeg={selectedLeg}
              onSelect={onSelectLeg}
            />
          ) : (
            <div className="json-view">
              <div className="json-view-head">
                <span>
                  quote.json <span>· validated fields</span>
                </span>
                <button className="text-button" onClick={onCopy}>
                  <Copy size={13} />
                  Copy JSON
                </button>
              </div>
              <pre>{json}</pre>
            </div>
          )}
        </div>
        <div className="graph-footer">
          <span>
            <span className="legend-line" />
            Token flow
          </span>
          <span>
            <span className="legend-node" />
            Liquidity venue
          </span>
          <span className="graph-scroll-hint">
            Scroll to follow the route →
          </span>
          <span className="graph-tip">
            Select a venue to inspect its leg <ArrowUpRight size={11} />
          </span>
        </div>
      </section>
      <section className="panel breakdown-panel">
        <div className="panel-title">
          <h2>
            Route breakdown
            <span className="count-badge">{quote.routePlan.length}</span>
          </h2>
          <span className="muted table-caption">LEG BY LEG</span>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Venue</th>
                <th>Path</th>
                <th>Allocation</th>
                <th className="align-right">Output amount</th>
                <th>
                  <span className="sr-only">Inspect</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {quote.routePlan.map((entry, index) => {
                const leg = entry.swapInfo;
                const percent = allocationPercent(entry);
                return (
                  <tr
                    key={index}
                    className={selectedLeg === index ? 'active' : ''}
                  >
                    <td>
                      <span className="table-venue">
                        <span className="venue-table-icon">
                          <Layers2 size={14} />
                        </span>
                        <strong>{leg.label}</strong>
                      </span>
                    </td>
                    <td>
                      <span className="table-path">
                        {getToken(leg.inputMint).symbol}
                        <ArrowRight size={11} />
                        {getToken(leg.outputMint).symbol}
                      </span>
                    </td>
                    <td>
                      <span className="allocation-cell">
                        <span className="allocation-bar">
                          <span
                            style={{
                              width: `${percent}%`,
                            }}
                          />
                        </span>
                        <span className="mono">{percent}%</span>
                      </span>
                    </td>
                    <td className="align-right mono">
                      {formatAmount(
                        leg.outAmount,
                        getToken(leg.outputMint).decimals,
                        4,
                      )}
                      <span className="table-token">
                        {getToken(leg.outputMint).symbol}
                      </span>
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={`Inspect ${leg.label} leg ${index + 1}`}
                        onClick={() =>
                          onSelectLeg(selectedLeg === index ? null : index)
                        }
                        aria-expanded={selectedLeg === index}
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {activeLeg && (
          <div className="leg-detail">
            <div>
              <span className="eyebrow">SELECTED LEG {selectedLeg! + 1}</span>
              <h3>{activeLeg.swapInfo.label}</h3>
            </div>
            <dl>
              <div>
                <dt>Pool address</dt>
                <dd className="mono full-address">
                  {activeLeg.swapInfo.ammKey}
                </dd>
              </div>
              <div>
                <dt>Input</dt>
                <dd className="mono">
                  {formatAmount(
                    activeLeg.swapInfo.inAmount,
                    getToken(activeLeg.swapInfo.inputMint).decimals,
                  )}{' '}
                  {getToken(activeLeg.swapInfo.inputMint).symbol}
                </dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd className="mono">
                  {formatAmount(
                    activeLeg.swapInfo.outAmount,
                    getToken(activeLeg.swapInfo.outputMint).decimals,
                  )}{' '}
                  {getToken(activeLeg.swapInfo.outputMint).symbol}
                </dd>
              </div>
              {activeLeg.swapInfo.feeAmount !== undefined && (
                <div>
                  <dt>Reported venue fee</dt>
                  <dd className="mono">
                    {formatAmount(
                      activeLeg.swapInfo.feeAmount,
                      activeLeg.swapInfo.feeMint
                        ? getToken(activeLeg.swapInfo.feeMint).decimals
                        : null,
                    )}{' '}
                    {activeLeg.swapInfo.feeMint
                      ? getToken(activeLeg.swapInfo.feeMint).symbol
                      : 'base units'}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
        <div className="breakdown-note">
          <Info size={13} />
          <span>
            Allocation is per leg; sequential hops may each show 100%. Amounts
            with … are truncated for display.
          </span>
        </div>
      </section>
      <section className="quote-details" aria-label="Quote details">
        <div>
          <span>
            {quote.swapMode === 'ExactIn'
              ? 'Minimum received'
              : 'Maximum input'}
          </span>
          <strong className="mono">
            {formatAmount(
              quote.otherAmountThreshold,
              quote.swapMode === 'ExactIn' ? output.decimals : input.decimals,
              6,
            )}{' '}
            {quote.swapMode === 'ExactIn' ? output.symbol : input.symbol}
          </strong>
        </div>
        <div>
          <span>Context slot</span>
          <strong className="mono">
            {quote.contextSlot?.toLocaleString('en-US') ?? 'Not provided'}
          </strong>
        </div>
        <div>
          <span>Provider quote time</span>
          <strong className="mono">
            {quote.timeTaken !== undefined
              ? `${(quote.timeTaken * 1000).toFixed(2)} ms`
              : 'Not provided'}
          </strong>
        </div>
      </section>
    </div>
  );
}
