import { useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import PropsPlayground from './PropsPlayground';
import ThemePlayground from './ThemePlayground';
import 'beautiful-grid/style.css';
import './Playground.css';
import type { Locale } from '../../i18n';
import { useSiteDarkTheme } from '../useSiteDarkTheme';

type PlaygroundMode = 'props' | 'theme';

export default function Playground({ locale = 'ko' }: { locale?: Locale }) {
  const [mode, setMode] = useState<PlaygroundMode>('props');
  const isDark = useSiteDarkTheme();

  return (
    <ConfigProvider theme={{ algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <section className='playground-shell' aria-label='BeautifulGrid playground' lang={locale}>
      <header className='playground-shell-header'>
        <div className='playground-shell-title'>
          <strong>Playground</strong>
          <span>{locale === 'en' ? 'Change any setting and inspect the result and code immediately.' : '모든 설정을 바꾸고 결과와 코드를 즉시 확인하세요.'}</span>
        </div>
        <div className='playground-mode-tabs' role='tablist' aria-label={locale === 'en' ? 'Playground mode' : 'Playground 모드'}>
          <button
            id='playground-props-tab'
            className='playground-mode-tab'
            type='button'
            role='tab'
            aria-selected={mode === 'props'}
            aria-controls='playground-mode-panel'
            onClick={() => setMode('props')}
          >
            Props & Features
          </button>
          <button
            id='playground-theme-tab'
            className='playground-mode-tab'
            type='button'
            role='tab'
            aria-selected={mode === 'theme'}
            aria-controls='playground-mode-panel'
            onClick={() => setMode('theme')}
          >
            Theme Builder
          </button>
        </div>
      </header>

      <div
        id='playground-mode-panel'
        className='playground-mode-content'
        role='tabpanel'
        aria-labelledby={mode === 'props' ? 'playground-props-tab' : 'playground-theme-tab'}
      >
        {mode === 'props' ? <PropsPlayground locale={locale} /> : <ThemePlayground locale={locale} />}
      </div>
      </section>
    </ConfigProvider>
  );
}
