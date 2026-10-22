import type { ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  Info,
  LockKeyhole,
  Network,
  Upload,
} from 'lucide-react';
import type { Page, Source } from '../types';

function Logo() {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true">
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="8.5"
        transform="rotate(-38 20 20)"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <circle cx="20" cy="20" r="4.5" fill="currentColor" />
      <circle cx="34" cy="11" r="3" fill="currentColor" />
    </svg>
  );
}

type AppShellProps = {
  page: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
  overlay: ReactNode;
};

export function AppShell({
  page,
  onNavigate,
  children,
  overlay,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => onNavigate('explorer')}
          aria-label="Orbit Explorer home"
        >
          <span className="brand-mark">
            <Logo />
          </span>
          <span>
            orbit<span className="brand-sub">EXPLORER</span>
          </span>
        </button>
        <div className="sidebar-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            className={`nav-item ${page === 'explorer' ? 'active' : ''}`}
            onClick={() => onNavigate('explorer')}
            aria-label="Route explorer"
            aria-current={page === 'explorer' ? 'page' : undefined}
          >
            <Network size={18} />
            <span>Route explorer</span>
            <span className="nav-indicator" />
          </button>
          <button
            className={`nav-item ${page === 'guide' ? 'active' : ''}`}
            onClick={() => onNavigate('guide')}
            aria-label="How it works"
            aria-current={page === 'guide' ? 'page' : undefined}
          >
            <BookOpen size={18} />
            <span>How it works</span>
          </button>
          <button
            className={`nav-item ${page === 'about' ? 'active' : ''}`}
            onClick={() => onNavigate('about')}
            aria-label="About Explorer"
            aria-current={page === 'about' ? 'page' : undefined}
          >
            <Info size={18} />
            <span>About Explorer</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card">
            <span className="privacy-icon">
              <LockKeyhole size={16} />
            </span>
            <strong>Just you and the route.</strong>
            <p>Your imports stay in your browser. No wallet needed.</p>
            <button onClick={() => onNavigate('about')}>
              Local by design <ArrowUpRight size={12} />
            </button>
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" />
            Browser local<span className="version">0.1.0</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="mobile-brand">
              <Logo />
            </span>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>
              {page === 'explorer'
                ? 'Route explorer'
                : page === 'guide'
                  ? 'How it works'
                  : 'About Explorer'}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="network-pill">
              <span className="sol-mini" />
              Solana
            </span>
            <span className="topbar-divider" />
            <button className="text-button" onClick={() => onNavigate('guide')}>
              Docs <ArrowUpRight size={13} />
            </button>
          </div>
        </header>
        <main id="main" className="main-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      {overlay}
    </div>
  );
}

export function ExplorerHeading({ onImport }: { onImport: () => void }) {
  return (
    <section className="page-heading">
      <div>
        <div className="eyebrow">
          <span className="tiny-orbit" />
          THE PATH BEHIND THE PRICE
        </div>
        <h1>
          Follow the route<span className="heading-dot">.</span>
        </h1>
        <p>See how a swap moves. Understand every hop.</p>
      </div>
      <button className="button secondary heading-import" onClick={onImport}>
        <Upload size={15} />
        Import quote<kbd>⌘ K</kbd>
      </button>
    </section>
  );
}

export function ExplorerFooter({
  source,
  onNavigate,
}: {
  source: Source;
  onNavigate: (page: Page) => void;
}) {
  return (
    <footer className="page-footer">
      <span>
        <LockKeyhole size={12} />
        No uploads. No wallet. Just the route.
      </span>
      <span
        title={
          source.kind === 'import'
            ? source.name
            : 'All sample values are fictional'
        }
      >
        {source.kind === 'sample'
          ? 'Demo data · not live prices'
          : `Local import · ${source.name}`}
        <span className="footer-separator">·</span>
        <button onClick={() => onNavigate('about')}>
          About Orbit Explorer <ArrowUpRight size={11} />
        </button>
      </span>
    </footer>
  );
}
