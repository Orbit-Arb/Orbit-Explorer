import { useEffect, useRef, useState } from 'react';
import { ArrowRight, FileJson, Upload, X } from 'lucide-react';
import { MAX_QUOTE_BYTES, parseQuote, type Quote } from '../lib/quote';

export function ImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (quote: Quote, name: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState('Imported quote');
  const [error, setError] = useState('');
  useEffect(() => {
    const trigger = document.activeElement;
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, []);

  async function readFile(file?: File) {
    if (!file) return;
    if (file.size > MAX_QUOTE_BYTES) {
      setError('Choose a JSON file smaller than 1 MiB.');
      return;
    }
    try {
      setText(await file.text());
      setFileName(file.name);
      setError('');
    } catch {
      setError('This file could not be read. Try pasting the JSON instead.');
    }
  }

  function submit() {
    try {
      onImport(parseQuote(text), fileName);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'This quote could not be imported.',
      );
    }
  }

  return (
    <dialog
      ref={dialog}
      className="import-dialog"
      aria-labelledby="import-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-head">
        <div className="eyebrow">YOUR QUOTE, EXPLAINED</div>
        <button
          className="icon-button"
          aria-label="Close import"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <h2 id="import-title">Bring your own route.</h2>
      <p className="muted">
        Import a Metis-compatible quote response. Your file stays in this
        browser tab.
      </p>
      <button
        className="upload-area"
        onClick={() => fileInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void readFile(e.dataTransfer.files[0]);
        }}
      >
        <span className="upload-icon">
          <Upload size={21} />
        </span>
        <strong>Choose a JSON file</strong>
        <span>or drop it here · up to 1 MiB</span>
      </button>
      <input
        ref={fileInput}
        className="sr-only"
        type="file"
        tabIndex={-1}
        accept=".json,application/json"
        aria-label="Quote JSON file"
        onChange={(e) => void readFile(e.target.files?.[0])}
      />
      <label className="textarea-label" htmlFor="quote-json">
        Or paste quote JSON <FileJson size={14} />
      </label>
      <textarea
        id="quote-json"
        className="json-input"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError('');
        }}
        spellCheck={false}
        maxLength={MAX_QUOTE_BYTES}
        aria-invalid={Boolean(error)}
        placeholder={
          '{\n  "inputMint": "So111...",\n  "inAmount": "1000000000",\n  "routePlan": [...]\n}'
        }
        aria-describedby={error ? 'import-error' : 'import-hint'}
      />
      {error ? (
        <p className="form-error" id="import-error" role="alert">
          {error}
        </p>
      ) : (
        <p className="input-hint" id="import-hint">
          Supports a quote object or a <code>quoteResponse</code> wrapper.
        </p>
      )}
      <div className="dialog-footer">
        <span>
          <span className="status-dot" />
          Processed locally
        </span>
        <button
          className="button primary"
          onClick={submit}
          disabled={!text.trim()}
        >
          Explore quote <ArrowRight size={15} />
        </button>
      </div>
    </dialog>
  );
}
