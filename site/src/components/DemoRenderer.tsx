import React, { Suspense } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import '../../../styles/globals.css';
import '../styles/datagrid-theme.css';
import './DemoRenderer.css';
import { useSiteDarkTheme } from './useSiteDarkTheme';

const modules = import.meta.glob('../../../examples/*.tsx');

export default function DemoRenderer({ sourcePath }: { sourcePath: string }) {
  const isDark = useSiteDarkTheme();
  const filename = sourcePath.split('/').pop();
  const resolvedPath = `../../../examples/${filename}`;
  const loadComponent = modules[resolvedPath] as () => Promise<{ default: React.ComponentType<any> }>;

  if (!loadComponent) {
    return <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>Component not found: {resolvedPath}</div>;
  }

  const LazyComponent = React.lazy(loadComponent);

  return (
    <ConfigProvider theme={{ algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <Suspense fallback={<div className='site-demo-loading'>Loading Demo...</div>}>
        <div className='site-grid-theme site-demo-renderer'>
          <LazyComponent />
        </div>
      </Suspense>
    </ConfigProvider>
  );
}
