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
  const loadComponent = modules[resolvedPath] as (() => Promise<{ default: React.ComponentType<any> }>) | undefined;

  const antdThemeConfig = React.useMemo(
    () => ({
      algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
      token: isDark
        ? {
            colorPrimary: '#6ea8ff',
            colorBgBase: '#111a2c',
            colorBgContainer: '#121c2f',
            colorBgElevated: '#151f33',
            colorBgLayout: '#182640',
            colorText: '#f2f6fc',
            colorTextSecondary: '#b9c5d8',
            colorTextTertiary: '#8391a8',
            colorTextQuaternary: '#64748b',
            colorBorder: '#26344c',
            colorBorderSecondary: '#3a4a65',
            colorFillSecondary: '#1a2942',
            colorFillTertiary: '#182640',
            colorFillQuaternary: '#151f33',
            borderRadius: 8,
          }
        : {
            colorPrimary: '#2563eb',
            borderRadius: 8,
          },
      components: isDark
        ? {
            Button: {
              defaultBg: '#121c2f',
              defaultBorderColor: '#3a4a65',
              defaultColor: '#f2f6fc',
              defaultHoverBg: '#1a2942',
              defaultHoverBorderColor: '#6ea8ff',
              defaultHoverColor: '#9ac2ff',
            },
            Segmented: {
              trackBg: '#182640',
              itemSelectedBg: '#151f33',
              itemSelectedColor: '#f2f6fc',
              itemColor: '#b9c5d8',
              itemHoverBg: '#1a2942',
              itemHoverColor: '#f2f6fc',
            },
            Select: {
              selectorBg: '#121c2f',
              optionSelectedBg: '#172b4c',
              optionSelectedColor: '#9ac2ff',
              optionActiveBg: '#1a2942',
            },
            Card: {
              colorBgContainer: '#111a2c',
              colorBorderSecondary: '#26344c',
            },
            Radio: {
              colorText: '#f2f6fc',
            },
            Modal: {
              contentBg: '#151f33',
              headerBg: '#151f33',
              titleColor: '#f2f6fc',
            },
          }
        : {},
    }),
    [isDark],
  );

  if (!loadComponent) {
    return <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>Component not found: {resolvedPath}</div>;
  }

  const LazyComponent = React.lazy(loadComponent);

  return (
    <ConfigProvider theme={antdThemeConfig}>
      <Suspense fallback={<div className='site-demo-loading'>Loading Demo...</div>}>
        <div className='site-grid-theme site-demo-renderer'>
          <LazyComponent />
        </div>
      </Suspense>
    </ConfigProvider>
  );
}
