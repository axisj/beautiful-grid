import { useState, Component, type ErrorInfo, type ReactNode } from 'react';
import { demoManifest } from '../../data/demoManifest';
import DemoRenderer from '../DemoRenderer';
import type { Locale } from '../../i18n';
import { learnDemoPath, learnMessages } from './learnLocale';

interface Props {
  locale: Locale;
  demoId: string;
  slug: string;
  title: string;
}

class DemoErrorBoundary extends Component<{ children: ReactNode; demoId: string; locale: Locale }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode; demoId: string; locale: Locale }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[BGrid Learn Demo Error (${this.props.demoId})]:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const messages = learnMessages[this.props.locale];
      return (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b' }}>
          <h4 style={{ margin: '0 0 0.5rem', fontSize: '1rem' }}>{messages.demoErrorHeading}</h4>
          <p style={{ margin: 0, fontSize: '0.875rem' }}>{this.state.error?.message || messages.unknownError}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function LiveDemoPanel({ locale, demoId, slug, title }: Props) {
  const [renderKey, setRenderKey] = useState(1);
  const manifestItem = demoManifest[demoId];
  const messages = learnMessages[locale];

  const handleReset = () => {
    setRenderKey(k => k + 1);
  };

  if (!manifestItem) {
    return (
      <div className="learn-demo-card">
        <div style={{ padding: '2rem', color: '#dc2626' }}>
          <strong>{messages.manifestError}:</strong> <code>{demoId}</code> {messages.missingManifest}
        </div>
      </div>
    );
  }

  const minHeight = manifestItem.minHeight || 450;
  const hasStandaloneDemo = slug === demoId;

  return (
    <div className="learn-demo-card">
      <div className="learn-demo-header">
        <div className="learn-demo-title-area">
          <span className="learn-demo-badge">LIVE DEMO</span>
          <span className="learn-demo-caption">{messages.interactiveExample(title)}</span>
        </div>
        <div className="learn-demo-actions">
          <button
            type="button"
            className="learn-demo-btn"
            onClick={handleReset}
            title={messages.resetTitle}
            aria-label={messages.resetAria}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            <span>{messages.reset}</span>
          </button>
          {hasStandaloneDemo && (
            <a
              href={learnDemoPath(slug, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="learn-demo-btn"
              title={messages.demoOnlyActionTitle}
              aria-label={messages.demoOnlyAria(title)}
            >
              <span>{messages.demoOnly}</span>
              <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
          )}
        </div>
      </div>
      <div className="learn-demo-surface" style={{ minHeight: `${minHeight}px` }}>
        <DemoErrorBoundary demoId={demoId} locale={locale}>
          <DemoRenderer key={renderKey} sourcePath={manifestItem.componentFile} />
        </DemoErrorBoundary>
      </div>
    </div>
  );
}

export default LiveDemoPanel;
