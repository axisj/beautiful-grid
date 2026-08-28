import packageJson from '../../../package.json';

export type LocalizedText = { ko: string; en: string };
export type ProductFeature = { id: string; name: LocalizedText; supported: boolean; note?: LocalizedText };
export type ProductLimitation = { id: string; name: LocalizedText; description: LocalizedText };

export const productFacts = {
  name: 'BeautifulGrid',
  packageName: 'beautiful-grid',
  summary: {
    ko: '업무용 React 화면을 위한 고급 기능 중심의 TypeScript DataGrid',
    en: 'A TypeScript DataGrid focused on advanced features for React business applications'
  },
  version: packageJson.version,
  licenseName: 'Apache-2.0',
  licenseUrl: 'https://github.com/axisj/beautiful-grid/blob/main/LICENSE',
  commercialUse: true,
  sourceAvailable: true,
  openSource: true,
  repositoryUrl: 'https://github.com/axisj/beautiful-grid',
  openSourceResources: {
    source: 'https://github.com/axisj/beautiful-grid/tree/main/beautiful-grid',
    tests: 'https://github.com/axisj/beautiful-grid/blob/main/.github/workflows/tests.yml',
    releases: 'https://github.com/axisj/beautiful-grid/blob/main/.github/workflows/publish-npm.yml',
    issues: 'https://github.com/axisj/beautiful-grid/issues',
    license: 'https://github.com/axisj/beautiful-grid/blob/main/LICENSE',
    notice: 'https://github.com/axisj/beautiful-grid/blob/main/NOTICE',
    trademark: 'https://github.com/axisj/beautiful-grid/blob/main/TRADEMARK.md',
    security: 'https://github.com/axisj/beautiful-grid/blob/main/SECURITY.md',
    contributing: 'https://github.com/axisj/beautiful-grid/blob/main/CONTRIBUTING.md',
  },
  npmUrl: 'https://www.npmjs.com/package/beautiful-grid',
  documentationUrl: 'https://bgrid.axisj.com/learn',
  demoUrl: 'https://bgrid.axisj.com/learn',
  programmingLanguage: 'TypeScript',
  runtimePlatform: 'React',
  features: [
    { id: 'virtual-scroll', name: { ko: '가상 스크롤', en: 'Virtual Scroll' }, supported: true },
    { id: 'editing', name: { ko: '셀 편집', en: 'Cell Editing' }, supported: true },
    { id: 'cell-navigation', name: { ko: '셀 포커스와 키보드 이동', en: 'Cell Focus & Keyboard Navigation' }, supported: true },
    { id: 'sorting-filtering', name: { ko: '정렬과 필터', en: 'Sorting & Filtering' }, supported: true },
    { id: 'frozen-columns', name: { ko: '고정 열', en: 'Frozen Columns' }, supported: true },
    { id: 'selection', name: { ko: '선택과 체크', en: 'Selection & Check' }, supported: true },
    { id: 'merge', name: { ko: '셀 병합과 Summary', en: 'Cell Merge & Summary' }, supported: true },
    { id: 'pivot', name: { ko: 'Pivot', en: 'Pivot' }, supported: true },
    { id: 'theme', name: { ko: 'CSS 변수 테마', en: 'CSS Variable Theme' }, supported: true },
    { id: 'dom', name: { ko: 'DOM 렌더링 장점', en: 'DOM Rendering Benefits' }, supported: true, note: { ko: '접근성, CSS 커스터마이징, 브라우저 기본 기능 호환', en: 'Accessibility, CSS customization, Browser native features' } }
  ],
  limitations: [
    { id: 'excel-formula', name: { ko: 'Excel 수식 엔진', en: 'Excel Formula Engine' }, description: { ko: 'Excel과 동일한 수식 평가 엔진은 제공하지 않음', en: 'Does not provide an Excel-equivalent formula evaluation engine' } },
    { id: 'designer', name: { ko: '전용 Designer/Ribbon', en: 'Dedicated Designer/Ribbon' }, description: { ko: 'UI 디자이너나 리본 툴바 미제공', en: 'No UI designer or ribbon toolbar provided' } }
  ],
  recommendedFor: [
    { ko: 'React 업무 화면에서 빠르고 가벼운 DataGrid가 필요한 경우', en: 'Need a fast and lightweight DataGrid in React business applications' },
    { ko: '셀 편집, 키보드 이동, 정렬·필터, 고정 열, 가상 스크롤을 화면 흐름에 맞춰 구성해야 하는 경우', en: 'Need to compose editing, keyboard navigation, sorting, filtering, frozen columns, and virtual scrolling around a screen workflow' }
  ],
  notRecommendedFor: [
    { ko: 'Excel의 모든 기능과 수식을 완벽히 대체해야 하는 경우', en: 'Need to perfectly replace all Excel features and formulas' }
  ],
  lastReviewedAt: new Date().toISOString().split('T')[0]
};
