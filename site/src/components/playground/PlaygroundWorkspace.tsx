import * as React from 'react';
import { CheckOutlined, CodeOutlined, ControlOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { highlightPlaygroundSource } from './highlightSource';
import type { Locale } from '../../i18n';
import '../../styles/datagrid-theme.css';

interface PlaygroundWorkspaceProps {
  eyebrow: string;
  title: string;
  description: string;
  controls: React.ReactNode;
  preview: React.ReactNode;
  source: string;
  sourceTitle: string;
  locale?: Locale;
}

const MIN_PANEL_WIDTH = 320;
const MAX_PANEL_WIDTH = 720;

export function PlaygroundWorkspace({
  eyebrow,
  title,
  description,
  controls,
  preview,
  source,
  sourceTitle,
  locale = 'ko',
}: PlaygroundWorkspaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [panelWidth, setPanelWidth] = useState(430);
  const [mobilePane, setMobilePane] = useState<'preview' | 'controls'>('preview');
  const [sourceOpen, setSourceOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const clampPanelWidth = (nextWidth: number) => {
    const workspaceWidth = workspaceRef.current?.clientWidth ?? 1200;
    const responsiveMax = Math.max(MIN_PANEL_WIDTH, Math.min(MAX_PANEL_WIDTH, workspaceWidth - 420));
    return Math.min(Math.max(nextWidth, MIN_PANEL_WIDTH), responsiveMax);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(max-width: 900px)').matches) return;

    const divider = event.currentTarget;
    const startX = event.clientX;
    const startWidth = panelWidth;
    divider.setPointerCapture(event.pointerId);
    document.body.classList.add('playground-is-resizing');

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setPanelWidth(clampPanelWidth(startWidth + moveEvent.clientX - startX));
    };

    const handlePointerUp = () => {
      document.body.classList.remove('playground-is-resizing');
      divider.removeEventListener('pointermove', handlePointerMove);
      divider.removeEventListener('pointerup', handlePointerUp);
      divider.removeEventListener('pointercancel', handlePointerUp);
    };

    divider.addEventListener('pointermove', handlePointerMove);
    divider.addEventListener('pointerup', handlePointerUp);
    divider.addEventListener('pointercancel', handlePointerUp);
  };

  useEffect(() => {
    const handleResize = () => setPanelWidth(current => clampPanelWidth(current));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      ref={workspaceRef}
      className='playground-workspace'
      data-mobile-pane={mobilePane}
      style={{ '--playground-panel-width': `${panelWidth}px` } as React.CSSProperties}
    >
      <div className='playground-mobile-workbar'>
        <div className='playground-mobile-pane-tabs' role='group' aria-label={locale === 'en' ? 'Workspace view' : '작업 화면'}>
          <button
            type='button'
            aria-pressed={mobilePane === 'preview'}
            onClick={() => setMobilePane('preview')}
          >
            <EyeOutlined aria-hidden='true' />
            {locale === 'en' ? 'Preview' : '미리보기'}
          </button>
          <button
            type='button'
            aria-pressed={mobilePane === 'controls'}
            onClick={() => setMobilePane('controls')}
          >
            <ControlOutlined aria-hidden='true' />
            {locale === 'en' ? 'Settings' : '설정'}
          </button>
        </div>
        <Button
          className='playground-mobile-source-button'
          icon={<CodeOutlined aria-hidden='true' />}
          onClick={() => setSourceOpen(true)}
        >
          {locale === 'en' ? 'Code' : '코드'}
        </Button>
      </div>

      <aside className='playground-control-panel' aria-label={`${title} ${locale === 'en' ? 'control panel' : '컨트롤 패널'}`}>
        <header className='playground-panel-header'>
          <div>
            <span className='playground-eyebrow'>{eyebrow}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <Button onClick={() => setSourceOpen(true)}>{locale === 'en' ? 'View source' : '소스 코드 보기'}</Button>
        </header>
        <div className='playground-control-scroll'>{controls}</div>
      </aside>

      <div
        className='playground-divider'
        role='separator'
        aria-label={locale === 'en' ? 'Resize control panel' : '컨트롤 패널 너비 조절'}
        aria-orientation='vertical'
        aria-valuemin={MIN_PANEL_WIDTH}
        aria-valuemax={MAX_PANEL_WIDTH}
        aria-valuenow={Math.round(panelWidth)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={event => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          setPanelWidth(current => clampPanelWidth(current + (event.key === 'ArrowRight' ? 24 : -24)));
        }}
      >
        <span aria-hidden='true' />
      </div>

      <main className='playground-preview-panel' aria-label={`${title} ${locale === 'en' ? 'preview' : '프리뷰'}`}>
        <div className='playground-preview-canvas site-grid-theme'>{preview}</div>
      </main>

      <Modal
        className='playground-source-modal'
        title={sourceTitle}
        open={sourceOpen}
        onCancel={() => setSourceOpen(false)}
        width='min(920px, calc(100vw - 32px))'
        footer={[
          <Button key='copy' type='primary' icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copySource}>
            {copied ? (locale === 'en' ? 'Copied' : '복사됨') : (locale === 'en' ? 'Copy code' : '코드 복사')}
          </Button>,
        ]}
      >
        <pre className='playground-source-code' tabIndex={0}>
          <code>{sourceOpen ? highlightPlaygroundSource(source) : source}</code>
        </pre>
      </Modal>
    </div>
  );
}
