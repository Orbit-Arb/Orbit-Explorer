import {
  ArrowRight,
  FileJson,
  GitBranch,
  LockKeyhole,
  MousePointer2,
} from 'lucide-react';

export function Guide({
  page,
  onExplore,
}: {
  page: 'guide' | 'about';
  onExplore: () => void;
}) {
  return (
    <div className="info-view">
      <span className="eyebrow">
        {page === 'guide' ? 'A LITTLE CONTEXT' : 'BUILT TO MAKE THINGS CLEAR'}
      </span>
      <h1>
        {page === 'guide'
          ? 'Every swap has a story.'
          : 'A clearer view of the route.'}
      </h1>
      <p className="info-intro">
        {page === 'guide'
          ? 'A quote is more than a price. It describes how tokens move through liquidity venues to reach their destination.'
          : 'Orbit Explorer is a small, independent developer tool for understanding Metis-compatible swap quotes on Solana.'}
      </p>
      {page === 'guide' ? (
        <>
          <div className="guide-grid">
            <article className="panel">
              <FileJson />
              <span className="eyebrow">01 / BRING A QUOTE</span>
              <h2>Start with an example.</h2>
              <p>
                Choose a synthetic sample, paste a quote response, or import a
                JSON file. No wallet or API key is needed.
              </p>
            </article>
            <article className="panel">
              <GitBranch />
              <span className="eyebrow">02 / FOLLOW THE PATH</span>
              <h2>See where it goes.</h2>
              <p>
                A direct route uses one venue. A split divides an amount across
                venues. A multi-hop route passes through an intermediate token.
              </p>
            </article>
            <article className="panel">
              <MousePointer2 />
              <span className="eyebrow">03 / LOOK CLOSER</span>
              <h2>Inspect each leg.</h2>
              <p>
                Select a venue in the diagram to inspect its pool and token
                amounts. The JSON view shows the validated quote fields.
              </p>
            </article>
          </div>
          <section className="panel glossary">
            <h2>The details, decoded</h2>
            <dl>
              <div>
                <dt>Expected output</dt>
                <dd>
                  The quoted output amount. It is an estimate, not a guarantee
                  of execution.
                </dd>
              </div>
              <div>
                <dt>Slippage tolerance</dt>
                <dd>
                  The configured price movement allowance. 50 basis points (bps)
                  equals 0.5%.
                </dd>
              </div>
              <div>
                <dt>Price impact</dt>
                <dd>
                  The quote provider’s estimate of how the swap affects the
                  price. The response expresses this as a percentage value.
                </dd>
              </div>
              <div>
                <dt>Minimum received / maximum input</dt>
                <dd>
                  The quote’s otherAmountThreshold: minimum output for ExactIn,
                  maximum input for ExactOut.
                </dd>
              </div>
              <div>
                <dt>Context slot</dt>
                <dd>
                  The Solana slot used for the quote. Imported data is a
                  snapshot; this tool does not check freshness.
                </dd>
              </div>
              <div>
                <dt>Unknown tokens</dt>
                <dd>
                  Amounts stay in raw base units when decimals are unknown.
                  Orbit Explorer never guesses a token’s precision.
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <>
          <section className="panel about-panel">
            <LockKeyhole size={25} />
            <div>
              <h2>Local by design.</h2>
              <p>
                Quote parsing and visualization happen in your browser. The app
                has no upload service, analytics, wallet connection, or trading
                controls. Imported data disappears when the tab reloads.
              </p>
            </div>
          </section>
          <section className="panel about-panel">
            <GitBranch size={25} />
            <div>
              <h2>Small enough to understand.</h2>
              <p>
                React, TypeScript, and a static build. The quote parser is
                independent of the interface, and route diagrams use native SVG.
                Any static host can serve the app.
              </p>
            </div>
          </section>
          <p className="about-note">
            All included examples are synthetic. Orbit Explorer is an
            independent project and is not affiliated with or endorsed by
            Jupiter or Metis. It does not currently request live quotes.
          </p>
        </>
      )}
      <button className="button primary" onClick={onExplore}>
        Open explorer <ArrowRight size={16} />
      </button>
    </div>
  );
}
