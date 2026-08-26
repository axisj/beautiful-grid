import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { demoManifest } from '../src/data/demoManifest';
import { createGridTheme, siteGridThemePalette } from '../src/data/datagridThemePalettes';
import { themeColorTokenNames } from '../src/data/datagridThemeTokenGroups';
import { legacyDocRedirects } from '../src/data/legacyRedirects';
import { productFacts } from '../src/data/productFacts';
import { bundleMetrics } from '../src/data/bundleMetrics';

const siteRoot = resolve(import.meta.dirname, '..');
const repositoryRoot = resolve(siteRoot, '..');

const readSiteFile = (path: string) => readFileSync(resolve(siteRoot, path), 'utf8');

describe('site product and navigation contracts', () => {
  it('uses the independent BeautifulGrid brand lockup', () => {
    const header = readSiteFile('src/components/layout/Header.astro');

    expect(header).toContain('class="brand-symbol"');
    expect(header).toContain('viewBox="0 0 36 24"');
    expect(header).toContain('id="site-logo-symbol-gradient"');
    expect(header).toContain('<span class="brand-name">Beautiful<span>Grid</span></span>');
    expect(header).toContain('aria-label={`BeautifulGrid ${messages.home}`}');
    expect(header).not.toContain('axboot-wordmark');
  });

  it('keeps all primary destinations in the shared header navigation', () => {
    const header = readSiteFile('src/components/layout/Header.astro');

    expect(header).toContain("href: localizePath('/learn', locale), route: '/learn', external: false");
    expect(header).toContain("href: localizePath('/api/props', locale), route: '/api/props', external: false");
    expect(header).toContain("href: localizePath('/product-facts', locale), route: '/product-facts', external: false");
    expect(header).toContain("href: localizePath('/open-source', locale), route: '/open-source', external: false");
    expect(header).toContain("href: localizePath('/playground', locale), route: '/playground', external: false");
    expect(header).toContain("href: productFacts.repositoryUrl, route: '', external: true");
    expect(header).toContain("import { GitFork } from 'lucide-react'");
    expect(header).toContain('<GitFork className="github-icon"');
    expect(header).not.toContain('class="header-actions desktop-only"');
  });

  it('keeps the displayed package version aligned with the publishable package', () => {
    const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')) as {
      version: string;
    };

    expect(productFacts.version).toBe(packageJson.version);
  });

  it('organizes homepage proof around verified product workflows', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain('BeautifulGrid의 검증 가능한 규모와 지원 환경');
    expect(homepage).toContain('실행 예제로 검증한 행 수');
    expect(homepage).toContain('<strong>550,000</strong>');
    expect(homepage).toContain("t('기본 행 높이', 'Row height')");
    expect(homepage).toContain('<strong>29px</strong>');
    expect(homepage).not.toContain('왜 55만 행인가?');
    expect(homepage).not.toContain('capability-limit-note');
    expect(homepage).toContain('<strong>{liveExampleCount}<small>');
    expect(homepage).toContain('기능별 실행 가이드');
    expect(homepage).toContain('편집부터 집계까지');
    expect(homepage).toContain('class="feature-tags"');
    expect(homepage).not.toContain('deprecated');
    expect(homepage).not.toContain('feature-coverage');
    expect(homepage).not.toContain('feature-counts');
    expect(bundleMetrics.initialTotalGzipKiB).toBeLessThanOrEqual(bundleMetrics.initialBundleBudgetGzipKiB);
    expect(bundleMetrics.columnReorderJsGzipKiB).toBeGreaterThan(0);
    expect(bundleMetrics.toolboxJsGzipKiB).toBeGreaterThan(0);
    expect(bundleMetrics.gridOptionalSurfacesJsGzipKiB).toBeGreaterThan(0);
    expect(bundleMetrics.measurement).toEqual({
      format: 'ESM',
      target: 'ES2020',
      compression: 'gzip level 9',
      excludesPeerDependencies: ['react', 'react-dom'],
    });
    expect(homepage).toContain('bundleMetrics.initialTotalGzipKiB');
    expect(homepage).toContain('초기 JS + CSS 합산 gzip');
    expect(homepage).toContain('bundleMetrics.initialJsGzipKiB');
    expect(homepage).toContain('bundleMetrics.cssGzipKiB');
    expect(homepage).toContain('React 제외');
    expect(homepage).not.toContain('bundle-composition');
    expect(homepage).not.toContain('--bundle-js-share');
    expect(homepage).toContain("t('번들사이즈', 'Bundle size')");
    expect(homepage).toContain("t('Performance', 'Performance')");
    expect(homepage).toContain("t('내 브라우저에서 검사하기', 'Test in my browser')");
    expect(homepage).not.toContain("t('스크롤 다시 측정', 'Measure scroll again')");
    expect(homepage).toContain("t('다양한 기능', 'Feature breadth')");
    expect(homepage).not.toContain('독립 실행으로 확인한 기능');
    expect(homepage).toContain('data-fps-measure');
    expect(homepage).toContain('<span data-fps-value>60</span>');
    expect(homepage).toContain('<span data-mount-value>56.6</span>');
    expect(homepage).toContain('스크롤 5회 중앙값 · 마운트 현재 로드');
    expect(homepage).toContain("document.querySelector<HTMLElement>('.hero-grid-stage .bgrid-scroll-container')");
    expect(homepage).toContain('window.requestAnimationFrame(measureFrame)');
    expect(homepage).toContain('스크롤 p95');
    expect(homepage).toContain("window.addEventListener('bgrid-home-grid-mounted'");
    expect(homepage).toContain("kicker: '대용량 탐색'");
    expect(homepage).toContain("kicker: '셀 편집'");
    expect(homepage).toContain("kicker: '조회와 선택'");
    expect(homepage).toContain("kicker: '구조화와 집계'");
  });

  it('reserves the responsive hero grid area while the client grid is loading', () => {
    const homepage = readSiteFile('src/pages/index.astro');
    const heroGrid = readSiteFile('src/components/home/HomeHeroGrid.tsx');

    expect(homepage).toContain('class="hero-grid-loading" data-hero-grid-loading role="status"');
    expect(homepage).toContain("t('데이터 그리드 불러오는 중', 'Loading DataGrid')");
    expect(homepage).toContain("heroGridStage?.classList.add('is-ready')");
    expect(homepage).toMatch(/\.hero-grid-loading\s*\{[^}]*height:\s*520px;/s);
    expect(homepage).toContain('.hero-grid-stage :global(.hero-grid-demo)');
    expect(homepage).toContain('@container (max-width: 519px)');
    expect(heroGrid).toContain('const [size, setSize] = React.useState<{ width: number; height: number }>();');
    expect(heroGrid).toContain('{size && (');
  });

  it('uses borderless modern cards below the hero grid', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toMatch(/\.capability-item\s*\{[^}]*border:\s*0;[^}]*border-radius:\s*18px;[^}]*backdrop-filter:\s*blur\(16px\);/s);
    expect(homepage).not.toContain('.capability-item::before');
    expect(homepage).not.toContain('.capability-item-fps.is-measured::before');
  });

  it('links the decision section to runtime and open-source guidance', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain("href={localizePath('/product-facts', locale)} class=\"btn btn-primary\"");
    expect(homepage).toContain("href={localizePath('/open-source', locale)} class=\"btn btn-outline\"");
    expect(homepage).toContain("t('지원 환경 확인', 'Review runtime support')");
    expect(homepage).toContain("t('오픈소스 안내', 'Explore open source')");
  });

  it('keeps the product facts route focused on runtime and compatibility guidance', () => {
    const environmentGuide = readSiteFile('src/pages/product-facts.astro');

    expect(environmentGuide).toContain('실행 환경 및 도입 안내 | BeautifulGrid');
    expect(environmentGuide).toContain('권장 브라우저');
    expect(environmentGuide).toContain('Node.js');
    expect(environmentGuide).toContain('22.12 이상');
    expect(environmentGuide).toContain('React');
    expect(environmentGuide).toContain('19.2.x');
    expect(environmentGuide).toContain('SSR 프레임워크에서는 DataGrid를 브라우저에서만 마운트합니다');
    expect(environmentGuide).toContain('Internet Explorer');
    expect(environmentGuide).not.toContain('<h1>Product Facts</h1>');
  });

  it('keeps dynamic prop controls in Playground instead of the example registry', () => {
    const astroConfig = readSiteFile('astro.config.mjs');
    const playground = readSiteFile('src/components/playground/Playground.tsx');
    const propsPlayground = readSiteFile('src/components/playground/PropsPlayground.tsx');
    const workspace = readSiteFile('src/components/playground/PlaygroundWorkspace.tsx');
    const themePlayground = readSiteFile('src/components/playground/ThemePlayground.tsx');
    const themePalettes = readSiteFile('src/data/datagridThemePalettes.ts');
    const themeTokenGroups = readSiteFile('src/data/datagridThemeTokenGroups.ts');
    const mockData = readSiteFile('src/components/playground/mockData.ts');
    const playgroundPage = readSiteFile('src/pages/playground.astro');
    const playgroundStyles = readSiteFile('src/components/playground/Playground.css');

    expect(demoManifest['dynamic-props']).toBeUndefined();
    expect(astroConfig).toContain("dedupe: ['react', 'react-dom']");
    expect(playground).toContain("import PropsPlayground from './PropsPlayground'");
    expect(playground).toContain('Props & Features');
    expect(playground).toContain('Theme Builder');
    expect(workspace).toMatch(/role=['"]separator['"]/);
    expect(workspace).toContain('소스 코드 보기');
    expect(propsPlayground).toContain('Layout & dimensions');
    expect(propsPlayground).toContain("layout='vertical' size='middle'");
    expect(propsPlayground).toContain("<Switch checked={checked}");
    expect(propsPlayground).toContain('Cell navigation & clipboard');
    expect(propsPlayground).toContain('dataControl={dataControl}');
    expect(propsPlayground).toContain("ariaLabel: '상품명 편집'");
    expect(propsPlayground).toContain("label='columnsGroup / columnGroups'");
    expect(propsPlayground).toContain(
      "columnsGroup={groupMode === 'columnsGroup' ? legacyColumnGroups",
    );
    expect(propsPlayground).toContain(
      "columnGroups={groupMode === 'columnGroups' ? nestedColumnGroups",
    );
    expect(propsPlayground).toContain(
      'footerHeight={useLegacyFooter ? footerHeight : undefined}',
    );
    expect(propsPlayground).not.toContain('itemRender: ({ editable');
    expect(themePlayground).toContain('ColorPicker');
    expect(themePlayground).toContain("name: 'Graphite'");
    expect(themePlayground).toContain("name: 'Forest'");
    expect(themePlayground).toContain("name: 'Violet'");
    expect(themePlayground).toContain("name: 'Coral'");
    expect(themePlayground).toContain('style={palette as React.CSSProperties}');
    expect(themePlayground).toContain("from '../../data/datagridThemeTokenGroups'");
    expect(themePlayground).toContain('themeColorGroups.map');
    expect(themePlayground).toContain('disabledAlpha={!alphaThemeColorTokens.has(key)}');
    expect(themePalettes).toContain("'--bgrid-scrollbar-modern-thumb-bg': '#aab4c0'");
    expect(themePalettes).toContain("'--bgrid-scrollbar-modern-gutter-bg': '#f2f5f8'");
    expect(themeTokenGroups).toContain("['--bgrid-scrollbar-modern-gutter-bg', 'Modern gutter']");
    expect(themePalettes).toContain("'--bgrid-toolbox-control-bg': '#ffffff'");
    expect(themePlayground).toContain("'--bgrid-toolbox-control-bg': '#172033'");
    expect(themeTokenGroups).toContain("['--bgrid-toolbox-control-bg', 'Filter control background']");
    expect(themePlayground).toContain("label: '고객', width: 170, toolbox: true, filter: { type: 'values' }");
    expect(themePlayground).toContain("mode: 'client'");
    expect(themePlayground).toContain('query: dataQuery');
    expect(readSiteFile('src/content/learn/theming.md')).toContain('--bgrid-toolbox-focus-ring-color');
    expect(readSiteFile('src/content/learn/theming.md')).toContain('문서 최상위 포털');
    expect(propsPlayground).toContain('Array.from({ length: 500 }');
    expect(themePlayground).toContain('Array.from({ length: 300 }');
    expect(mockData).toContain("['장기영', '국정일', '정동환', '양용성', '구소라', '장서우', '박혜영', '김동근']");
    expect(mockData).toContain("['IMTSOFT', '골든서클', '푸르니', '스파이씨', '위포', '태인스포먼트']");
    expect(playgroundPage).toContain('height: calc(100dvh - 69px)');
    expect(playgroundStyles).toContain('.playground-preview-canvas::-webkit-scrollbar-thumb');
    expect(playgroundStyles).toContain('scrollbar-color: var(--playground-card-scrollbar-thumb) transparent');
    expect(playgroundStyles).toMatch(/\.playground-control-form \.ant-input-number-input \{[^}]*height: 32px;/s);
    expect(playgroundStyles).toMatch(/\.playground-control-form \.ant-select-single[^}]*min-height: 34px;/s);
    expect(playgroundStyles).toMatch(/\.playground-source-code \{[^}]*background: #0b1120 !important;/s);
    expect(playgroundStyles).toMatch(/\.playground-source-code code \{[^}]*max-height: none;/s);
    expect(playgroundStyles).toMatch(/\.theme-preview-head h3 \{[^}]*color: #334155;/s);
    expect(playgroundStyles).toMatch(/\.theme-preview-head p \{[^}]*color: #94a3b8;/s);
    expect(propsPlayground).toContain('<BGrid');
  });

  it('keeps every library color token editable in Theme Builder and defined by the site palette', () => {
    const libraryCss = readFileSync(resolve(repositoryRoot, 'beautiful-grid/style.css'), 'utf8');
    const libraryColorTokens = Array.from(new Set(libraryCss.match(/--bgrid-[a-z0-9-]+/g) ?? []))
      .filter(token => /-color(?:-|$)|-bg$/.test(token))
      .sort();
    const builderColorTokens = [...themeColorTokenNames].sort();

    expect(new Set(themeColorTokenNames).size).toBe(themeColorTokenNames.length);
    expect(builderColorTokens).toEqual(libraryColorTokens);
    for (const token of themeColorTokenNames) {
      expect(siteGridThemePalette[token], `${token} is missing from the site palette`).toBeDefined();
    }

    const graphiteTheme = createGridTheme({
      '--bgrid-primary-color': '#38bdf8',
      '--bgrid-body-bg': '#111827',
      '--bgrid-body-color': '#dbe4ef',
      '--bgrid-body-hover-bg': '#243248',
      '--bgrid-body-active-bg': '#153e5a',
      '--bgrid-border-color-light': '#3d4b60',
      '--bgrid-frozen-boundary-color': '#64748b',
      '--bgrid-footer-bg': '#172033',
      '--bgrid-scrollbar-modern-track-bg': '#1f2937',
      '--bgrid-scrollbar-modern-thumb-bg': '#64748b',
      '--bgrid-scrollbar-modern-thumb-hover-bg': '#94a3b8',
      '--bgrid-scrollbar-modern-button-hover-bg': '#334155',
      '--bgrid-scrollbar-modern-gutter-bg': '#1f2937',
      '--bgrid-scrollbar-modern-gutter-border-color': '#475569',
      '--bgrid-toolbox-bg': '#111827',
      '--bgrid-toolbox-color': '#dbe4ef',
      '--bgrid-toolbox-muted-color': '#94a3b8',
      '--bgrid-toolbox-control-bg': '#172033',
      '--bgrid-toolbox-control-color': '#dbe4ef',
      '--bgrid-toolbox-control-border-color': '#475569',
      '--bgrid-toolbox-hover-bg': '#243248',
    });

    expect(graphiteTheme['--bgrid-search-bg']).toBe('#111827');
    expect(graphiteTheme['--bgrid-context-menu-bg']).toBe('#111827');
    expect(graphiteTheme['--bgrid-active-cell-ring-color']).toBe('#38bdf8');
    expect(graphiteTheme['--bgrid-scrollbar-classic-track-bg']).toBe('#1f2937');
    expect(graphiteTheme['--bgrid-loading-bg']).toBe('rgba(56, 189, 248, 0.08)');
    expect(graphiteTheme['--bgrid-loading-color']).toBe('rgba(56, 189, 248, 0.18)');
  });

  it('keeps legacy docs and examples as noindex redirects to Learn', () => {
    const redirectLayout = readSiteFile('src/layouts/LegacyRedirectLayout.astro');
    const docsRoute = readSiteFile('src/pages/docs/[slug].astro');
    const examplesRoute = readSiteFile('src/pages/examples/[slug].astro');

    expect(Object.keys(legacyDocRedirects)).toHaveLength(14);
    expect(redirectLayout).toContain('noindex, follow');
    expect(redirectLayout).toContain('rel="canonical"');
    expect(redirectLayout).toContain('새 학습 페이지로 이동');
    expect(docsRoute).toContain('legacyDocRedirects');
    expect(examplesRoute).toContain('demoManifest');
  });

  it('does not reintroduce known invalid internal routes in the shared shell or homepage', () => {
    const sources = [
      readSiteFile('src/components/layout/Header.astro'),
      readSiteFile('src/components/layout/Footer.astro'),
      readSiteFile('src/pages/index.astro'),
    ].join('\n');

    for (const invalidRoute of ['/features', '/demos', '/docs/api', '/license', '/alternatives']) {
      expect(sources).not.toMatch(new RegExp(`href=[{\"']+${invalidRoute}(?:[\"'}]|/)`));
    }
  });

  it('presents BeautifulGrid as an AXISJ project and links the related services', () => {
    const footer = readSiteFile('src/components/layout/Footer.astro');

    expect(footer).toContain('src="/axisj-wordmark.svg" alt="AXISJ"');
    expect(footer).toContain("intro: 'AXISJ가 만드는 BeautifulGrid.'");
    expect(footer).toContain("intro: 'BeautifulGrid, built by AXISJ.'");
    expect(footer).toContain('href="https://axisj.com"');
    expect(footer).toContain('href="https://manualtalk.axisj.com"');
    expect(footer).toContain("href={localizePath('/learn', locale)} data-footer-route=\"/learn\"");
    expect(footer).toContain("href={localizePath('/product-facts', locale)} data-footer-route=\"/product-facts\"");
    expect(footer).toContain("href={localizePath('/api/props', locale)} data-footer-route=\"/api/props\"");
    expect(footer).toContain("href={localizePath('/open-source', locale)} data-footer-route=\"/open-source\"");
    expect(footer).toContain("learn: 'Learn & Examples'");
    expect(footer).toContain('Open source under Apache-2.0');
    expect(footer).not.toContain('axboot.dev');
  });

  it('renders the live DataGrid island instead of a decorative grid placeholder', () => {
    const homepage = readSiteFile('src/pages/index.astro');
    const heroGrid = readSiteFile('src/components/home/HomeHeroGrid.tsx');
    const heroGridStyles = readSiteFile('src/components/home/HomeHeroGrid.css');
    const themePalettes = readSiteFile('src/data/datagridThemePalettes.ts');

    expect(homepage).toContain('<HomeHeroGrid locale={locale} client:only="react" />');
    expect(homepage).toContain('class="hero-grid-stage"');
    expect(homepage).not.toContain('hero-demo-shell');
    expect(homepage).not.toContain('hero-demo-header');
    expect(homepage).not.toContain('hero-demo-footer');
    expect(homepage).toContain('max-width: 108rem');
    expect(homepage).toContain('width: 100%');
    expect(homepage).not.toContain('hero-badge');
    expect(homepage).not.toContain('browser-chrome');
    expect(heroGrid).toContain('<BGrid<OrderRow>');
    expect(heroGrid).toContain('dataControl={dataControl}');
    expect(heroGrid).toContain('rowChecked={{');
    expect(heroGrid).toContain('React.useState<React.Key[]>([])');
    expect(heroGrid).toContain('cellSelectionOptions={{ enabled: true }}');
    expect(heroGrid).toContain('cellNavigationOptions={{ enabled: true, editOnEnter: false }}');
    expect(heroGrid).toContain('meta?.dataItem ?? { ...item, values }');
    expect(heroGrid).toContain("import '../../styles/datagrid-theme.css'");
    expect(heroGrid).toContain("className='hero-grid-viewport site-grid-theme'");
    expect(heroGrid).not.toContain('style={heroGridPalette}');
    expect(heroGrid).toContain('useSiteDarkTheme()');
    expect(heroGrid).toContain('antdTheme.darkAlgorithm');
    expect(heroGrid).toContain(
      "className: column.editable === false ? 'hero-grid-cell-readonly' : 'hero-grid-cell-editable'",
    );
    expect(heroGrid).toContain("variant='vertical-bordered'");
    expect(heroGrid).toContain("height: width < 520 ? 280 : width < 720 ? 340 : width < 1000 ? 420 : 520");
    expect(heroGrid).toContain('const mountStartedAtRef = React.useRef(performance.now())');
    expect(heroGrid).toContain("new CustomEvent('bgrid-home-grid-mounted'");
    expect(heroGrid).toContain('document.documentElement.dataset.bgridHomeGridMountMs');
    expect(heroGridStyles).not.toContain('.bgrid-column-axis-active');
    expect(heroGridStyles).not.toContain('.bgrid-row-axis-active');
    expect(heroGridStyles).toContain('td.hero-grid-cell-editable:not(.bgrid-cell-selected)');
    expect(heroGridStyles).toContain('td.hero-grid-cell-readonly:not(.bgrid-cell-selected)');
    expect(heroGridStyles).toContain('var(--hero-grid-cell-editable-bg)');
    expect(heroGridStyles).toContain('var(--hero-grid-cell-readonly-bg)');
    expect(heroGridStyles).not.toContain('td.bgrid-cell-active:not(.bgrid-cell-editing)');
    expect(themePalettes).toContain("'--bgrid-cell-selected-bg': '#e1f0ff'");
    expect(themePalettes).toContain("'--bgrid-cell-selected-border-color': '#4f94f8'");
    expect(themePalettes).toContain("'--bgrid-selection-axis-bg': '#dbeafe'");
    expect(themePalettes).toContain("'--bgrid-cell-value-changed-bg': '#fff7ed'");
    expect(heroGridStyles).toContain(':not(.bgrid-cell-value-changed)');
    expect(heroGridStyles).toContain('.bgrid-editor-portal-root .ant-select-item-option-content');
    expect(heroGrid).toContain("from '../../../../examples/editor-plugins/createAntdDatePickerEditorPlugin'");
    expect(heroGrid).toContain("from '../../../../examples/editor-plugins/createAntdSelectEditorPlugin'");
    expect(heroGrid).toContain("from '../../../../examples/editing/editorIcons'");
    expect(heroGrid.match(/createAntdSelectEditorPlugin<OrderRow/g)).toHaveLength(10);
    expect(heroGrid.match(/createAntdDatePickerEditorPlugin<OrderRow/g)).toHaveLength(1);
    expect(heroGrid.match(/editorIcon: \{/g)).toHaveLength(6);
    expect(heroGrid.match(/visibility: 'always'/g)).toHaveLength(12);
    expect(heroGrid).not.toContain('createSelectEditorPlugin');
    expect(heroGrid).not.toContain('createDateEditorPlugin');
    expect(heroGrid).toContain("type: 'text'");
    expect(heroGrid).toContain("ariaLabel: '담당자 편집'");
    expect(heroGrid).toContain("ariaLabel: '상품 편집'");
    expect(heroGrid).not.toContain("id: 'home-sales-rep'");
    expect(heroGrid).not.toContain("id: 'home-product'");
    expect(heroGrid).toContain("ariaLabel: '수량 편집'");
    expect(heroGrid).toContain('parseValue: text =>');
    expect(heroGrid).toContain("id: 'home-status'");
    expect(heroGrid).toContain("id: 'home-delivery-date'");
    expect(heroGrid).toContain('editor: statusEditor');
    expect(heroGrid).toContain('editor: deliveryDateEditor');
    expect(heroGrid).not.toContain('function QuantityCell');
    expect(heroGrid).not.toContain('handleSave');
    expect(heroGrid).not.toContain('첫 열 고정');
    expect(heroGrid).not.toContain('Dense');
    expect(heroGrid).not.toContain('hero-grid-feature-list');
  });

  it('explains verified feature and performance tradeoffs on the homepage', () => {
    const homepage = readSiteFile('src/pages/index.astro');
    const virtualScrollExample = readFileSync(resolve(repositoryRoot, 'examples/ScrollExample.tsx'), 'utf8');

    expect(homepage).toContain('현재 화면에 필요한 셀만 렌더링');
    expect(homepage).toContain('가상 스크롤의 원리');
    expect(homepage).toContain('55만 행 × 24열이면 셀은 모두 1,320만 개입니다.');
    expect(homepage).toContain("<strong>13,200,000<small>{t('셀', 'cells')}</small></strong>");
    expect(homepage).toContain("<strong>≈ 240<small>{t('셀', 'cells')}</small></strong>");
    expect(homepage).toContain('render-budget');
    expect(homepage).toContain('budget-canvas');
    expect(homepage).toContain('budget-viewport');
    expect(homepage).toContain('현재 보이는 영역');
    expect(homepage).toContain('budget-grid');
    expect(homepage).toContain("href={localizePath('/learn/virtual-scroll', locale)}");
    expect(homepage).toContain("href={localizePath('/learn/pagination', locale)}");
    expect(virtualScrollExample).toContain('const ROW_COUNT = 550000');
    expect(virtualScrollExample).not.toContain('itemHeight={14}');
    expect(virtualScrollExample).not.toContain('itemPadding={6}');
    expect(550000 * (15 + 7 * 2) + 30).toBe(15_950_030);
    expect(16_777_216 - (550000 * (15 + 7 * 2) + 30)).toBe(827_186);
    expect(550000 * (15 + 7 * 2) + 30).toBeLessThan(16_777_216);
    expect(Math.floor((16_777_216 - 30) / 550000)).toBe(30);
    expect(550000 * 30 + 30).toBeLessThan(16_777_216);
    expect(550000 * 31 + 30).toBeGreaterThan(16_777_216);
    expect(virtualScrollExample).toContain("label: '주문 번호'");
    expect(virtualScrollExample).toContain("label: '거래 위험도'");
    expect(virtualScrollExample).not.toContain('React.useTransition()');
    expect(virtualScrollExample).not.toContain('dataControl={dataControl}');
    expect(virtualScrollExample).toContain('columns={virtualScrollColumns}');
    expect(virtualScrollExample).toContain('toolbox: false as const');
    expect(homepage).toContain('첫 행부터 550,000번째 행까지 가상 스크롤로 탐색합니다');
  });

  it('keeps the homepage positioning aligned in Korean and English', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain("t('오픈소스 · Apache-2.0', 'Open Source · Apache-2.0')");
    expect(homepage).toContain("t('아름답게, 강력하게.', 'Beautiful. Powerful.')");
    expect(homepage).toContain("t('React로 자연스럽게.', 'Naturally React.')");
    expect(homepage).toContain('아름다운 기본 디자인으로 바로 시작하고');
    expect(homepage).toContain("t('5분 만에 시작하기', 'Get started in 5 minutes')");
    expect(homepage).toContain("t('라이브 데모 보기', 'View live demos')");
    expect(homepage).toContain("t('도입 기준은 분명하게,', 'Clear adoption baseline,')");
    expect(homepage).toContain("t('사용과 확장은 자유롭게.', 'open use and extension.')");
    expect(homepage).toContain("t('최신 안정 브라우저 지원', 'Current stable browsers')");
    expect(homepage).toContain("t('오픈소스', 'open source')");
    expect(homepage).not.toContain('React 생태계에 자연스럽게,');
    expect(homepage).not.toContain('조회부터 편집·집계까지,');
    expect(homepage).not.toContain('complete the workflow in one screen.');
  });

  it('explains the Apache-2.0 open-source promise without overstating community size', () => {
    const openSourcePage = readSiteFile('src/pages/open-source.astro');

    expect(productFacts.licenseName).toBe('Apache-2.0');
    expect(productFacts.openSource).toBe(true);
    expect(productFacts.commercialUse).toBe(true);
    expect(openSourcePage).toContain('OPEN SOURCE · APACHE-2.0');
    expect(openSourcePage).toContain('상업적으로 사용하세요');
    expect(openSourcePage).toContain('LICENSE RESPONSIBILITIES');
    expect(openSourcePage).toContain('커뮤니티 규모를 과장하지 않습니다.');
    expect(openSourcePage).toContain("productFacts.repositoryUrl + '/issues'");
  });

  it('curates example-backed homepage proof without an autoplay billboard', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain("import { getCollection } from 'astro:content';");
    expect(homepage).toContain("const liveExampleCount = (await getCollection('learn')).filter(");
    expect(homepage).toContain("item.data.locale === 'ko' && !item.data.draft && item.data.demoId");
    expect(homepage).toContain('const featuredExamples = [');
    expect(homepage).toContain("href: '/learn/built-in-editors'");
    expect(homepage).toContain("href: '/learn/editor-plugins'");
    expect(homepage).toContain("href: '/learn/editing-merged-cells'");
    expect(homepage).toContain("href: '/learn/pivot'");
    expect(homepage).toContain('class="example-grid"');
    expect(homepage).not.toContain('data-demo-carousel');
  });

  it('keeps Korean homepage headings readable without overly compressed tracking', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain('letter-spacing: -0.028em;');
    expect(homepage).toContain('letter-spacing: -0.018em;');
    expect(homepage).toContain('letter-spacing: -0.015em;');
    expect(homepage).toContain('letter-spacing: -0.01em;');
    expect(homepage).not.toContain('letter-spacing: -0.062em;');
    expect(homepage).not.toContain('letter-spacing: -0.052em;');
    expect(homepage).not.toContain('letter-spacing: -0.045em;');
    expect(homepage).not.toContain('letter-spacing: -0.04em;');
  });

  it('shows all three Quick Start code blocks without tab interaction', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toContain('class="quick-start-list"');
    expect(homepage.match(/class="quick-start-item"/g)).toHaveLength(3);
    expect(homepage.match(/<div class="quick-start-code-block(?: quick-start-code-block-install)?">/g)).toHaveLength(3);
    expect(homepage).not.toContain('code-window-bar');
    expect(homepage).not.toContain('code-window-header');
    expect(homepage).not.toContain('role="tablist"');
    expect(homepage).not.toContain('data-quick-start-tab');
    expect(homepage).not.toContain('data-quick-start-panel');
  });

  it('keeps the Quick Start rounded border on the outer code block only', () => {
    const homepage = readSiteFile('src/pages/index.astro');

    expect(homepage).toMatch(
      /\.quick-start-code-block\s*\{[^}]*overflow:\s*hidden;[^}]*border:\s*1px solid #223049;[^}]*border-radius:\s*18px;/s,
    );
    expect(homepage).toMatch(/\.quick-start-code-block pre\s*\{[^}]*border:\s*0;[^}]*border-radius:\s*0;/s);
  });

  it('keeps legacy example styles loaded and site table styles out of DataGrid internals', () => {
    const demoRenderer = readSiteFile('src/components/DemoRenderer.tsx');
    const demoStyles = readSiteFile('src/components/DemoRenderer.css');
    const dataGridThemeStyles = readSiteFile('src/styles/datagrid-theme.css');
    const globalStyles = readSiteFile('src/styles/globals.css');
    const postcssConfig = readSiteFile('postcss.config.cjs');
    const rootPostcssConfig = readFileSync(resolve(repositoryRoot, 'postcss.config.cjs'), 'utf8');
    const tailwindConfig = readFileSync(resolve(repositoryRoot, 'tailwind.config.cjs'), 'utf8');

    expect(demoRenderer).toContain("import '../../../styles/globals.css'");
    expect(demoRenderer).toContain("import '../styles/datagrid-theme.css'");
    expect(demoRenderer).toContain("className='site-grid-theme site-demo-renderer'");
    expect(demoRenderer).toContain(
      'algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm',
    );
    expect(demoStyles).toContain('.site-demo-renderer .data-grid-container');
    expect(dataGridThemeStyles).toContain('.site-grid-theme .bgrid-root');
    for (const [token, value] of Object.entries(siteGridThemePalette)) {
      expect(dataGridThemeStyles).toContain(`${token}: ${value};`);
    }
    expect(postcssConfig).toContain("require('../postcss.config.cjs')");
    expect(rootPostcssConfig).toContain("path.join(__dirname, 'tailwind.config.cjs')");
    expect(tailwindConfig).toContain('relative: true');
    expect(tailwindConfig).toContain("path.join(__dirname, 'examples/**/*.{ts,tsx,js,jsx}')");
    expect(globalStyles).toContain('.table-wrapper table');
    expect(globalStyles).toContain('.table-wrapper th');
    expect(globalStyles).not.toMatch(/^table\s*\{/m);
    expect(globalStyles).not.toMatch(/^th, td\s*\{/m);
  });

  it('shows all runtime sources used by each learning demo', () => {
    const sourcePanel = readSiteFile('src/components/learn/SourceCodePanel.astro');
    const learnStyles = readSiteFile('src/styles/learn.css');

    expect(demoManifest.basic.sourceFiles).toEqual(
      expect.arrayContaining([
        'examples/BasicExample.tsx',
        'components/DataGridContainer.tsx',
        'components/DataGridContainer.css',
        'hooks/useContainerSize.ts',
      ]),
    );
    expect(demoManifest.editing.sourceFiles).toEqual(
      expect.arrayContaining([
        'examples/BasicEditingExample.tsx',
        'examples/editing/shared.ts',
        'examples/editing/editingExamples.css',
      ]),
    );
    expect(sourcePanel).toContain("import { readFileSync } from 'node:fs'");
    expect(sourcePanel).toContain("const repositoryRoot = fileURLToPath(new URL('../../../../', import.meta.url))");
    expect(sourcePanel).toContain("const isInsideRepository = !relativeSourcePath.startsWith('..')");
    expect(sourcePanel).toContain("code = readFileSync(absoluteSourcePath, 'utf8')");
    expect(sourcePanel).toContain("blob/master/'");
    expect(sourcePanel).toContain(
      "themes={{ light: 'github-light', dark: 'github-dark-high-contrast' }}",
    );
    expect(sourcePanel).toContain('defaultColor="light"');
    expect(learnStyles).toContain('background-color: var(--site-surface-elevated, #ffffff);');
    expect(learnStyles).toContain(
      'scrollbar-color: var(--site-border-strong, #cbd5e1) var(--site-surface, #f7f9fc);',
    );
  });

  it('uses public package imports and a measured container in every DataGrid example', () => {
    const exampleFiles = [
      'BasicExample.tsx',
      'CellMergeExample.tsx',
      'CellNavigationExample.tsx',
      'CheckedExample.tsx',
      'ColumnSortExample.tsx',
      'ColumnsGroupExample.tsx',
      'ContainerResizeExample.tsx',
      'EditorExample.tsx',
      'FocusExample.tsx',
      'FrozenColumnsExample.tsx',
      'GetRowClassName.tsx',
      'LineNumberExample.tsx',
      'LoadingExample.tsx',
      'PagingExample.tsx',
      'PivotExample.tsx',
      'ReorderExample.tsx',
      'ScrollExample.tsx',
      'ScrollbarExample.tsx',
      'SortExample.tsx',
      'SummaryExample.tsx',
      'ToolboxExample.tsx',
    ];

    for (const file of exampleFiles) {
      const source = readFileSync(resolve(repositoryRoot, 'examples', file), 'utf8');
      expect(source).toContain('beautiful-grid');
      expect(source).toContain('DataGridContainer');
      expect(source).not.toContain('ExampleContainer');
    }
  });

  it('documents the implemented active-cell keyboard navigation contract', () => {
    const guide = readSiteFile('src/content/learn/cell-navigation.md');
    const accessibilityGuide = readSiteFile('src/content/learn/accessibility-and-keyboard.md');
    const demo = readFileSync(resolve(repositoryRoot, 'examples/CellNavigationExample.tsx'), 'utf8');

    expect(demoManifest['cell-navigation'].componentFile).toBe('CellNavigationExample.tsx');
    expect(productFacts.features).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'cell-navigation', supported: true })]),
    );
    expect(guide).toContain('cellNavigationOptions');
    expect(guide).toContain('PageUp');
    expect(guide).toContain('<kbd>Space</kbd>');
    expect(guide).toContain('`BGridProps.onClick`');
    expect(guide).toContain('제어형 모드');
    expect(accessibilityGuide).toContain('/learn/cell-navigation');
    expect(accessibilityGuide).not.toContain(
      '화살표 키 기반 행 이동, Tab 기반 셀 순회, Enter 기반 편집 진입은 현재 공통 그리드 계약으로 제공되지 않습니다.',
    );
    expect(demo).toContain('cellNavigationOptions={{');
    expect(demo).toContain('cellSelectionOptions={{ enabled: selectionEnabled }}');
    expect(demo).toContain('cellMergeOptions={{');
    expect(demo).toContain('frozenColumnIndex={1}');
    expect(demo).toContain("ariaLabel: '고객 편집'");
    expect(demo).toContain("ariaLabel: '상품 편집'");
    expect(demo).not.toContain('function TextEditor');
    expect(demo).not.toContain('BGridItemRenderProps');
    expect(demo).toContain('마지막 클릭 활성화');
  });

  it('uses a dedicated interactive example for frozen columns', () => {
    const guide = readSiteFile('src/content/learn/frozen-columns.md');
    const demo = readFileSync(resolve(repositoryRoot, 'examples/FrozenColumnsExample.tsx'), 'utf8');

    expect(demoManifest['frozen-columns'].componentFile).toBe('FrozenColumnsExample.tsx');
    expect(guide).toContain('demoId: "frozen-columns"');
    expect(demo).toContain('frozenColumnIndex={frozenColumnIndex}');
    expect(demo).toContain('고정할 선행 컬럼 수');
  });

  it('keeps Learn examples in the product-oriented category structure', () => {
    const catalog = readSiteFile('src/pages/learn/index.astro');
    const sidebar = readSiteFile('src/components/learn/LearnSidebar.astro');

    expect(readSiteFile('src/content/learn/virtual-scroll.md')).toContain('category: "data-and-columns"');
    expect(readSiteFile('src/content/learn/container-resize.md')).toContain('category: "getting-started"');
    expect(readSiteFile('src/content/learn/scrollbar.md')).toContain('category: "styling-and-accessibility"');
    expect(catalog).not.toContain("'performance': '성능 및 가상화");
    expect(sidebar).not.toContain("'performance': '성능 & 대용량");
  });

  it('provides a dedicated interactive example for the grid variant prop', () => {
    const guide = readSiteFile('src/content/learn/variant.md');
    const demo = readFileSync(resolve(repositoryRoot, 'examples/VariantExample.tsx'), 'utf8');

    expect(demoManifest.variant.componentFile).toBe('VariantExample.tsx');
    expect(guide).toMatch(/demoId: ["']variant["']/);
    expect(guide).toContain('`vertical-bordered`');
    expect(demo).toContain("React.useState<GridVariant>('default')");
    expect(demo).toContain('variant={variant}');
    expect(demo).toContain('<Segmented');
    expect(demo).toContain("aria-label='세로 구분선 variant 선택'");
  });

  it('provides a dedicated interactive example for scoped CSS variable themes', () => {
    const guide = readSiteFile('src/content/learn/theming.md');
    const demo = readFileSync(resolve(repositoryRoot, 'examples/ThemingExample.tsx'), 'utf8');
    const styles = readFileSync(resolve(repositoryRoot, 'examples/ThemingExample.css'), 'utf8');

    expect(demoManifest.theming.componentFile).toBe('ThemingExample.tsx');
    expect(demoManifest.theming.sourceFiles).toEqual(
      expect.arrayContaining(['examples/ThemingExample.tsx', 'examples/ThemingExample.css']),
    );
    expect(guide).toMatch(/demoId: ["']theming["']/);
    expect(demo).toContain("React.useState<ThemeId>('default')");
    expect(demo).toContain("<div className='theming-example'>");
    expect(demo).not.toContain('theming-example--${theme}');
    expect(demo).toContain("className={`theming-example-grid bgrid-theme-${theme}`}");
    expect(demo).toContain("aria-label='데이터그리드 테마 선택'");
    expect(styles).toContain('.bgrid-theme-brand');
    expect(styles).toContain('.bgrid-theme-dark');
    expect(styles).toContain('--bgrid-header-bg: #0f766e;');
    expect(styles).toContain('--bgrid-body-bg: #0f172a;');
    expect(styles).toContain('--bgrid-scrollbar-modern-track-bg: #1e293b;');
    expect(styles).toContain('--bgrid-scrollbar-modern-thumb-bg: #475569;');
    expect(styles).toContain('--bgrid-scrollbar-modern-gutter-bg: #1e293b;');
  });

  it('documents a resize-safe container example for changing layouts', () => {
    const guide = readSiteFile('src/content/learn/container-resize.md');
    const demo = readFileSync(resolve(repositoryRoot, 'examples/ContainerResizeExample.tsx'), 'utf8');
    const containerStyles = readFileSync(resolve(repositoryRoot, 'components/DataGridContainer.css'), 'utf8');

    expect(demoManifest['container-resize'].componentFile).toBe('ContainerResizeExample.tsx');
    expect(guide).toContain('ResizeObserver');
    expect(guide).toContain('작아질 때');
    expect(demo).toContain('useContainerSize');
    expect(demo).toContain('gridTemplateColumns');
    expect(containerStyles).toContain('position: absolute');
    expect(containerStyles).toContain('inset: 0');
  });
});
