import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { demoManifest } from '../src/data/demoManifest';
import { apiMemberId, apiReferenceEntries, apiTypeId } from '../src/data/apiReference';

const learnDir = path.resolve(__dirname, '../src/content/learn');
const examplesDir = path.resolve(__dirname, '../../examples');
const repositoryRoot = path.resolve(__dirname, '../..');

describe('Learn Content Architecture Contracts', () => {
  it('uses an unambiguous Korean title for checkbox and radio row controls', () => {
    const guide = fs.readFileSync(path.join(learnDir, 'row-selection.md'), 'utf8');

    expect(guide).toContain('title: "행 선택 및 체크박스 (Checkbox & Radio Selection)"');
    expect(guide).not.toContain('(Row Selection)');
  });

  it('keeps Getting Started focused on installation and page integration', () => {
    const gettingStartedGuide = fs.readFileSync(path.join(learnDir, 'getting-started.md'), 'utf8');

    expect(gettingStartedGuide).not.toMatch(/^demoId:/m);
    expect(gettingStartedGuide).toContain('npm install beautiful-grid');
    expect(gettingStartedGuide).toContain("import 'beautiful-grid/style.css'");
    expect(gettingStartedGuide).toContain('new ResizeObserver(updateSize)');
    expect(gettingStartedGuide).toContain('<BGrid<User>');
    expect(gettingStartedGuide).toContain("rowKey='id'");
    expect(gettingStartedGuide).toContain('{ values: { id:');
    expect(gettingStartedGuide).toContain('](/learn/basic)');
    expect(gettingStartedGuide).not.toContain('FulfillmentOrder');
    expect(gettingStartedGuide).not.toContain('주문 출고 예외 관리');
  });

  it('routes built-in editor readers through the official plugin hub', () => {
    const editingGuide = fs.readFileSync(path.join(learnDir, 'editing.md'), 'utf8');
    const builtInGuide = fs.readFileSync(path.join(learnDir, 'built-in-editors.md'), 'utf8');
    const pluginHub = fs.readFileSync(path.join(learnDir, 'editor-plugins.md'), 'utf8');
    const antdGuide = fs.readFileSync(path.join(learnDir, 'editor-plugins-antd.md'), 'utf8');

    expect(editingGuide).toContain('title: "셀 편집 시작하기 (Cell Editing)"');
    expect(editingGuide).toContain('demoId: "editing"');
    expect(editingGuide).toContain('](/plugins)');
    expect(builtInGuide).toContain('](/plugins)');
    expect(pluginHub).toContain('title: "에디터 플러그인 개요 (Editor Plugins Overview)"');
    expect(pluginHub).toContain('canonicalPath: "/plugins"');
    expect(pluginHub).not.toMatch(/^demoId:/m);
    expect(pluginHub).toContain('](/plugins/antd)');
    expect(pluginHub).toContain('](/plugins/shadcn)');
    expect(pluginHub).toContain('](/plugins/mui)');
    expect(pluginHub).toContain('](/plugins/mantine)');
    expect(pluginHub).toContain('](/plugins/custom)');
    expect(antdGuide).toContain('demoId: "editor-plugins-antd"');
    expect(antdGuide).toContain('defineEditorPlugin');
    expect(antdGuide).toContain('getPortalContainer');
  });

  it('separates plugin routes and navigation from the Learn catalog', () => {
    const pluginLayout = fs.readFileSync(path.join(repositoryRoot, 'site/src/layouts/PluginLayout.astro'), 'utf8');
    const pluginSidebar = fs.readFileSync(path.join(repositoryRoot, 'site/src/components/plugins/PluginSidebar.astro'), 'utf8');
    const pluginRoutes = fs.readFileSync(path.join(repositoryRoot, 'site/src/components/plugins/pluginLocale.ts'), 'utf8');
    const learnLocale = fs.readFileSync(path.join(repositoryRoot, 'site/src/components/learn/learnLocale.ts'), 'utf8');

    expect(pluginLayout).toContain('<PluginSidebar');
    expect(pluginLayout).not.toContain('<LearnSidebar');
    expect(pluginSidebar).toContain('data-plugin-sidebar');
    expect(pluginRoutes).toContain("localizePath(routeSlug ? `/plugins/${routeSlug}` : '/plugins', locale)");
    expect(learnLocale).toContain('!isPluginLearnSlug(learnSlug(item.id))');
  });

  it('renders a matching live demo before source code on every localized plugin detail page', () => {
    const pluginArticle = fs.readFileSync(
      path.join(repositoryRoot, 'site/src/components/plugins/PluginArticlePage.astro'),
      'utf8',
    );
    const liveDemoIsland = fs.readFileSync(
      path.join(repositoryRoot, 'site/src/components/learn/LiveDemoIsland.astro'),
      'utf8',
    );
    const pluginSlugs = ['antd', 'shadcn', 'mui', 'mantine'];

    for (const slug of pluginSlugs) {
      for (const localePrefix of ['', 'en/']) {
        const guide = fs.readFileSync(
          path.join(learnDir, `${localePrefix}editor-plugins-${slug}.md`),
          'utf8',
        );
        expect(guide).toContain(`demoId: "editor-plugins-${slug}"`);
      }
      expect(demoManifest[`editor-plugins-${slug}`]).toBeDefined();
    }

    expect(pluginArticle).toContain('data-plugin-live-demo={slug}');
    expect(pluginArticle.indexOf('<LiveDemoIsland')).toBeLessThan(pluginArticle.indexOf('<SourceCodePanel'));
    expect(liveDemoIsland).toContain('client:only="react"');
    expect(liveDemoIsland).toContain('slot="fallback"');
    expect(liveDemoIsland).toContain('messages.demoLoading');
  });

  it('documents clipboard value conversion for plugin editors in both locales', () => {
    const guides = [
      'editor-plugins-antd.md',
      'en/editor-plugins-antd.md',
      'editor-plugins-shadcn.md',
      'en/editor-plugins-shadcn.md',
    ].map(file => fs.readFileSync(path.join(learnDir, file), 'utf8'));
    const publicTypes = fs.readFileSync(path.join(repositoryRoot, 'beautiful-grid/types.ts'), 'utf8');
    const antdExample = fs.readFileSync(path.join(examplesDir, 'ExternalEditorPluginExample.tsx'), 'utf8');
    const shadcnExample = fs.readFileSync(path.join(examplesDir, 'ExternalShadcnEditorPluginExample.tsx'), 'utf8');

    guides.forEach(guide => {
      expect(guide).toContain('getClipboardText');
      expect(guide).toContain('parseClipboardText');
      expect(guide).toContain('JSON.parse');
      expect(guide).toContain('itemRender');
    });
    expect(publicTypes).toContain('parseClipboardText?:');
    expect(antdExample).toContain("from '@beautifuljs/grid-antd'");
    expect(antdExample).toContain('parseClipboardText: parseCascaderClipboardText');
    expect(shadcnExample).toContain('parseClipboardText: parseCascaderClipboardText');
    expect(demoManifest['editor-plugins-antd'].sourceFiles).not.toContain('examples/editor-plugins/cascaderValue.ts');
    expect(demoManifest['editor-plugins-shadcn'].sourceFiles).toContain('examples/editor-plugins/cascaderValue.ts');
  });

  it('documents and demonstrates the official MUI and Mantine packages with their exact supported scope', () => {
    const integrations = [
      {
        slug: 'mui',
        packageName: '@beautifuljs/grid-mui',
        example: 'ExternalMuiEditorPluginExample.tsx',
        factoryPrefix: 'Mui',
      },
      {
        slug: 'mantine',
        packageName: '@beautifuljs/grid-mantine',
        example: 'ExternalMantineEditorPluginExample.tsx',
        factoryPrefix: 'Mantine',
      },
    ];

    integrations.forEach(({ slug, packageName, example, factoryPrefix }) => {
      const guides = [
        fs.readFileSync(path.join(learnDir, `editor-plugins-${slug}.md`), 'utf8'),
        fs.readFileSync(path.join(learnDir, `en/editor-plugins-${slug}.md`), 'utf8'),
      ];
      const source = fs.readFileSync(path.join(examplesDir, example), 'utf8');

      guides.forEach(guide => {
        expect(guide).toContain(packageName);
        for (const editor of ['Select', 'DatePicker', 'ColorPicker', 'TimePicker']) {
          expect(guide).toContain(editor);
        }
        expect(guide).toContain('Cascader');
        expect(guide).toContain('TreeSelect');
      });
      expect(source).toContain(`from '${packageName}'`);
      for (const editor of ['Select', 'DatePicker', 'ColorPicker', 'TimePicker']) {
        expect(source).toContain(`create${factoryPrefix}${editor}EditorPlugin`);
      }
      expect(source).not.toContain(`create${factoryPrefix}CascaderEditorPlugin`);
      expect(source).not.toContain(`create${factoryPrefix}TreeSelectEditorPlugin`);
      expect(demoManifest[`editor-plugins-${slug}`].componentFile).toBe(example);
    });
  });

  it('documents merged clipboard atomicity and unsupported payload handling in both locales', () => {
    const accessibilityGuides = ['accessibility-and-keyboard.md', 'en/accessibility-and-keyboard.md'].map(file =>
      fs.readFileSync(path.join(learnDir, file), 'utf8'),
    );
    const mergedGuides = ['editing-merged-cells.md', 'en/editing-merged-cells.md'].map(file =>
      fs.readFileSync(path.join(learnDir, file), 'utf8'),
    );
    const publicTypes = fs.readFileSync(path.join(repositoryRoot, 'beautiful-grid/types.ts'), 'utf8');
    const table = fs.readFileSync(path.join(repositoryRoot, 'beautiful-grid/components/Table.tsx'), 'utf8');
    const homeGrid = fs.readFileSync(path.join(repositoryRoot, 'site/src/components/home/HomeHeroGrid.tsx'), 'utf8');

    accessibilityGuides.forEach(guide => {
      expect(guide).toContain('text/plain');
      expect(guide).toContain('unsupportedClipboardData');
      expect(guide).toContain('mergedCellConflict');
    });
    mergedGuides.forEach(guide => {
      expect(guide).toContain('getClipboardText');
      expect(guide).toContain('parseClipboardText');
      expect(guide).toContain('mergedCellConflict');
    });
    expect(publicTypes).toContain("| 'unsupportedClipboardData'");
    expect(publicTypes).toContain("| 'mergedCellConflict'");
    expect(table).toContain('copiedLogicalCells');
    expect(table).toContain('logicalResolutionData');
    expect(homeGrid).toContain('getClipboardText: ({ value }) => formatCascaderClipboardText(value)');
    expect(homeGrid).toContain('parseClipboardText: parseCascaderClipboardText');
  });

  it('documents itemRender as a component and Canvas extension point', () => {
    const guide = fs.readFileSync(path.join(learnDir, 'item-render.md'), 'utf8');
    const example = fs.readFileSync(path.join(examplesDir, 'ItemRenderExample.tsx'), 'utf8');
    const styles = fs.readFileSync(path.join(examplesDir, 'ItemRenderExample.css'), 'utf8');

    expect(guide).toMatch(/demoId:\s*['"]item-render['"]/);
    expect(guide).toContain('Canvas 스파크라인');
    expect(guide).toMatch(/`itemRender` 자체에서 Hook을 호출하지 말고/);
    expect(guide).toContain('getClipboardText');
    expect(example).toContain('function SparklineCanvas');
    expect(example).toContain('function UtilizationCanvas');
    expect(example).toContain('event.stopPropagation()');
    expect(example).toContain("role='img'");
    expect(styles).toMatch(/\.item-render-center,[\s\S]*line-height: normal;/);
    expect(styles).toMatch(/\.item-render-status \{[\s\S]*line-height: normal;/);
    expect(demoManifest['item-render'].sourceFiles).toEqual(
      expect.arrayContaining(['examples/ItemRenderExample.tsx', 'examples/ItemRenderExample.css']),
    );
  });

  it('keeps Grid search documentation aligned with its public API and live example', () => {
    const searchGuide = fs.readFileSync(path.join(learnDir, 'search.md'), 'utf8');
    const searchExample = fs.readFileSync(path.join(examplesDir, 'SearchExample.tsx'), 'utf8');
    const publicTypes = fs.readFileSync(path.join(repositoryRoot, 'beautiful-grid/types.ts'), 'utf8');

    expect(searchGuide).toMatch(/^title:\s*['"]그리드 검색 \(Grid Search\)['"]$/m);
    expect(searchGuide).toMatch(/demoId:\s*['"]search['"]/);
    expect(searchGuide).toContain('현재 로드된 표시 데이터');
    expect(searchGuide).toContain('서버 전체 검색이나 검색 결과만 남기는 필터 모드는 이 API의 범위가 아닙니다.');
    expect(searchExample).toContain('searchOptions={{');
    expect(searchExample).toContain('contextMenuOptions={{');
    expect(searchExample).toContain('getSearchText: ({ value }) => `${value}%`');
    expect(publicTypes).toContain('searchOptions?: BGridSearchOptions<T>');
    expect(publicTypes).toContain('contextMenuOptions?: BGridContextMenuOptions<T>');
  });

  it('documents column visibility as a v1.0.6 toolbox feature in both locales', () => {
    const koreanGuide = fs.readFileSync(path.join(learnDir, 'column-visibility.md'), 'utf8');
    const englishGuide = fs.readFileSync(path.join(learnDir, 'en/column-visibility.md'), 'utf8');
    const example = fs.readFileSync(path.join(examplesDir, 'ColumnVisibilityExample.tsx'), 'utf8');

    expect(koreanGuide).toContain('title: "컬럼 숨김과 복구 (Column Visibility)"');
    expect(koreanGuide).toContain('sinceVersion: "1.0.6"');
    expect(englishGuide).toContain('sinceVersion: "1.0.6"');
    expect(example).toContain('toolbox: true');
    expect(example).toContain('dataControl={{');
    expect(example).toContain("data-testid='hidden-column-status'");
  });

  it('documents tree folding as available since v1.0.12 in both locales', () => {
    const koreanGuide = fs.readFileSync(path.join(learnDir, 'tree-folding.md'), 'utf8');
    const englishGuide = fs.readFileSync(path.join(learnDir, 'en/tree-folding.md'), 'utf8');

    expect(koreanGuide).toContain("sinceVersion: '1.0.12'");
    expect(englishGuide).toContain("sinceVersion: '1.0.12'");
  });

  it('keeps the context menu guide aligned with its dedicated live example', () => {
    const contextMenuGuide = fs.readFileSync(path.join(learnDir, 'context-menu.md'), 'utf8');
    const contextMenuExample = fs.readFileSync(path.join(examplesDir, 'ContextMenuExample.tsx'), 'utf8');

    expect(contextMenuGuide).toMatch(/demoId:\s*['"]context-menu['"]/);
    expect(contextMenuGuide).toContain('visibleIndex');
    expect(contextMenuGuide).toContain('sourceIndex');
    expect(contextMenuGuide).toContain('searchOptions.contextMenu = false');
    expect(contextMenuExample).toContain('contextMenuOptions={{');
    expect(contextMenuExample).toContain("type: 'separator'");
    expect(contextMenuExample).toContain("disabled: target.values.status === t('완료', 'Completed')");
  });

  it('keeps the keyboard shortcut guide aligned with current runtime surfaces', () => {
    const guide = fs.readFileSync(path.join(learnDir, 'accessibility-and-keyboard.md'), 'utf8');
    const table = fs.readFileSync(path.join(repositoryRoot, 'beautiful-grid/components/Table.tsx'), 'utf8');
    const search = fs.readFileSync(
      path.join(repositoryRoot, 'beautiful-grid/components/search/GridSearchPopover.tsx'),
      'utf8',
    );
    const contextMenu = fs.readFileSync(
      path.join(repositoryRoot, 'beautiful-grid/components/context-menu/GridContextMenu.tsx'),
      'utf8',
    );
    const rowReorder = fs.readFileSync(
      path.join(repositoryRoot, 'beautiful-grid/utils/useRowReorderController.ts'),
      'utf8',
    );

    expect(guide).toContain('lastReviewedAt: "2026-08-29"');
    expect(guide).toContain('Ctrl/Cmd + Home / End');
    expect(guide).toContain('Ctrl/Cmd + V');
    expect(guide).toContain('Context Menu 키 / Shift + F10');
    expect(guide).toContain('행 재정렬 핸들');
    expect(table).toContain("evt.key === 'ContextMenu'");
    expect(table).toContain("if (key === 'a')");
    expect(table).toContain("if (key === 'c')");
    expect(search).toContain("event.shiftKey ? 'previous' : 'next'");
    expect(contextMenu).toContain("if (event.key === 'Home') next = 0");
    expect(rowReorder).toContain("event.key === 'ArrowUp' || event.key === 'ArrowDown'");
  });

  it('learn content files exist and have valid structure', () => {
    const files = fs.readdirSync(learnDir).filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    expect(files.length).toBeGreaterThanOrEqual(15);

    const slugs = files.map(f => f.replace(/\.(md|mdx)$/, ''));

    files.forEach(file => {
      const fullPath = path.join(learnDir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const slug = file.replace(/\.(md|mdx)$/, '');

      // Frontmatter extraction
      const match = content.match(/^---\n([\s\S]*?)\n---/);
      expect(match, `File ${file} must have valid frontmatter`).toBeTruthy();
      const fmText = match![1];

      // 1. title check
      expect(fmText).toMatch(/title:\s*["'].+["']/);

      // 2. description check
      expect(fmText).toMatch(/description:\s*["'].+["']/);

      // 3. category check
      expect(fmText).toMatch(
        /category:\s*["'](getting-started|data-and-columns|interaction|advanced|styling-and-accessibility)["']/,
      );

      // 4. canonicalPath check
      const pluginCanonicalPaths: Record<string, string> = {
        'editor-plugins': '/plugins',
        'editor-plugins-custom': '/plugins/custom',
        'editor-plugins-antd': '/plugins/antd',
        'editor-plugins-shadcn': '/plugins/shadcn',
        'editor-plugins-mui': '/plugins/mui',
        'editor-plugins-mantine': '/plugins/mantine',
      };
      const canonicalPath = pluginCanonicalPaths[slug] || `/learn/${slug}`;
      expect(fmText).toMatch(new RegExp(`canonicalPath:\\s*["']${canonicalPath}["']`));

      // 5. lastReviewedAt format (YYYY-MM-DD)
      expect(fmText).toMatch(/lastReviewedAt:\s*["']\d{4}-\d{2}-\d{2}["']/);

      // 6. demoId check if present
      const demoIdMatch = fmText.match(/demoId:\s*["']([^"']+)["']/);
      if (demoIdMatch) {
        const demoId = demoIdMatch[1];
        expect(demoManifest[demoId], `demoId "${demoId}" in ${file} must exist in demoManifest`).toBeDefined();
      }

      // 7. relatedGuides slugs validity
      const relatedMatch = fmText.match(/relatedGuides:\s*\[([^\]]*)\]/);
      if (relatedMatch && relatedMatch[1].trim()) {
        const relatedList = relatedMatch[1]
          .split(',')
          .map(s => s.trim().replace(/['"]/g, ''))
          .filter(Boolean);

        relatedList.forEach(relatedSlug => {
          expect(slugs, `relatedGuide "${relatedSlug}" in ${file} must exist in learn collection`).toContain(
            relatedSlug,
          );
        });
      }
    });
  });

  it('all demoManifest entries point to real component and source files', () => {
    Object.entries(demoManifest).forEach(([demoId, manifest]) => {
      expect(manifest.componentFile, `demo "${demoId}" componentFile must be specified`).toBeTruthy();
      const componentPath = path.join(examplesDir, manifest.componentFile);
      expect(
        fs.existsSync(componentPath),
        `Component file ${manifest.componentFile} must exist in root examples/`,
      ).toBe(true);

      manifest.sourceFiles.forEach(sourceFile => {
        const sourcePath = path.join(repositoryRoot, sourceFile);
        expect(
          fs.existsSync(sourcePath),
          `Source file ${sourceFile} for demo "${demoId}" must exist in the repository`,
        ).toBe(true);
      });

      expect(manifest.minHeight, `demo "${demoId}" minHeight must be at least 200px`).toBeGreaterThanOrEqual(200);
    });
  });

  it('all Learn API links point to generated public reference anchors', () => {
    const validAnchors = new Set(
      apiReferenceEntries.flatMap(entry => [
        apiTypeId(entry.name),
        ...entry.members.map(member => apiMemberId(entry.name, member.name)),
      ]),
    );
    const files = fs.readdirSync(learnDir).filter(file => file.endsWith('.md') || file.endsWith('.mdx'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(learnDir, file), 'utf8');
      const frontmatter = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
      const relatedApi = frontmatter.match(/relatedApi:\s*\[([^\]]*)\]/)?.[1] ?? '';
      const links = relatedApi.match(/"[^"]+"|'[^']+'/g)?.map(link => link.slice(1, -1)) ?? [];

      links.forEach(link => {
        const match = link.match(/^\/api\/props#(.+)$/);
        expect(match, `relatedApi "${link}" in ${file} must target /api/props#anchor`).toBeTruthy();
        expect(validAnchors, `API anchor "${match?.[1]}" in ${file} must exist`).toContain(match?.[1]);
      });
    });
  });
});
