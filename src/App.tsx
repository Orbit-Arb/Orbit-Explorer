import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { SAMPLES } from './data/samples';
import type { Quote } from './lib/quote';
import type { Page, Source, ViewTab } from './types';
import {
  AppShell,
  ExplorerFooter,
  ExplorerHeading,
} from './components/AppShell';
import { Guide } from './components/Guide';
import { ImportDialog } from './components/ImportDialog';
import { QuoteSource } from './components/QuoteSource';
import { QuoteResults } from './components/QuoteResults';

function App() {
  const initialSample =
    SAMPLES.find((sample) => sample.id === 'split') ?? SAMPLES[0];
  const [page, setPage] = useState<Page>('explorer');
  const [quote, setQuote] = useState<Quote>(initialSample.quote);
  const [source, setSource] = useState<Source>({
    kind: 'sample',
    id: initialSample.id,
  });
  const [importOpen, setImportOpen] = useState(false);
  const [tab, setTab] = useState<ViewTab>('diagram');
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const json = JSON.stringify(quote, null, 2);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setImportOpen(true);
      }
    }
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timeout);
  }, [notice]);

  function loadQuote(next: Quote, nextSource: Source) {
    setQuote(next);
    setSource(nextSource);
    setSelectedLeg(null);
    setTab('diagram');
    setPage('explorer');
  }
  function downloadQuote() {
    const url = URL.createObjectURL(
      new Blob([json], { type: 'application/json' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'orbit-quote.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Validated quote downloaded.');
  }
  async function copyQuote() {
    try {
      await navigator.clipboard.writeText(json);
      setNotice('Quote JSON copied.');
    } catch {
      setNotice('Clipboard unavailable. Use Download JSON to save the quote.');
    }
  }

  return (
    <AppShell
      page={page}
      onNavigate={setPage}
      overlay={
        <>
          {importOpen && (
            <ImportDialog
              onClose={() => setImportOpen(false)}
              onImport={(next, name) => {
                loadQuote(next, { kind: 'import', name });
                setImportOpen(false);
                setNotice('Quote imported. Your data stays in this tab.');
              }}
            />
          )}
          <div
            className={`toast ${notice ? 'visible' : ''}`}
            role="status"
            aria-live="polite"
          >
            {notice && (
              <>
                <Check size={15} />
                {notice}
              </>
            )}
          </div>
        </>
      }
    >
      {page === 'explorer' ? (
        <>
          <ExplorerHeading onImport={() => setImportOpen(true)} />
          <div className="workspace-grid">
            <QuoteSource
              quote={quote}
              source={source}
              onLoadQuote={loadQuote}
              onImport={() => setImportOpen(true)}
            />
            <QuoteResults
              quote={quote}
              source={source}
              tab={tab}
              onTabChange={setTab}
              selectedLeg={selectedLeg}
              onSelectLeg={setSelectedLeg}
              json={json}
              onDownload={downloadQuote}
              onCopy={() => void copyQuote()}
            />
          </div>
          <ExplorerFooter source={source} onNavigate={setPage} />
        </>
      ) : (
        <Guide page={page} onExplore={() => setPage('explorer')} />
      )}
    </AppShell>
  );
}

export default App;
