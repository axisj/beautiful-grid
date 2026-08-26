import { localizePath, type Locale } from '../../i18n';

export const learnCategoryOrder = [
  'getting-started',
  'data-and-columns',
  'interaction',
  'advanced',
  'styling-and-accessibility',
] as const;

export const learnMessages = {
  ko: {
    indexTitle: '학습 가이드 & 예제 카탈로그 | BeautifulGrid Learn',
    indexDescription: 'BeautifulGrid의 기본 사용법부터 셀 편집, 정렬, 필터, 가상 스크롤, 피벗까지 실행 가능한 예제와 상세 튜토리얼을 제공합니다.',
    indexHeading: '예제 중심 통합 학습 가이드',
    indexIntro: '실제 동작하는 라이브 DataGrid와 소스 코드, 그리고 실무 적용에 필요한 상세 설명을 한곳에서 확인하세요.',
    categories: {
      'getting-started': '시작하기',
      'data-and-columns': '데이터와 컬럼',
      interaction: '상호작용 및 편집',
      advanced: '고급 기능',
      'styling-and-accessibility': '스타일과 접근성',
    },
    guideCount: (count: number) => `${count}개 가이드`,
    details: '상세 가이드 & 코드 보기',
    demoOnly: '데모만 보기',
    demoOnlyTitle: '새 탭에서 데모만 열기',
    overview: '학습 가이드 개요',
    navigation: 'Learn 탐색',
    breadcrumb: '이동 경로',
    previous: '이전 가이드',
    next: '다음 가이드',
    pagination: 'Learn 페이지 이동',
    reviewedAt: '검토일',
    relatedApi: '관련 API',
    liveDemoSection: '라이브 데모',
    sourceSection: '예제 소스 코드',
    relatedGuides: '함께 읽어볼 추천 가이드',
    readMore: '자세히 보기',
    interactiveExample: (title: string) => `${title} 인터랙티브 예제`,
    reset: '초기화',
    resetTitle: '데모 상태를 초기값으로 되돌립니다',
    resetAria: '데모 초기화',
    demoOnlyActionTitle: '새 탭에서 그리드 동작 화면만 봅니다',
    demoOnlyAria: (title: string) => `${title} 데모만 새 탭으로 보기`,
    demoErrorHeading: '데모 렌더링 중 오류가 발생했습니다',
    unknownError: '알 수 없는 오류',
    manifestError: '오류',
    missingManifest: 'Demo Manifest에 항목이 등록되어 있지 않습니다.',
    sourceTabs: '예제 소스 코드 파일 탭',
    copyTitle: '클립보드에 코드 복사',
    copyAria: '소스 코드 복사',
    copy: '복사',
    copied: '복사됨!',
    copyFailed: '실패',
    githubTitle: 'GitHub에서 원본 파일 보기',
    githubAria: 'GitHub 원본 파일 열기',
    sourceUnavailable: '// 소스 코드를 불러올 수 없습니다.',
  },
  en: {
    indexTitle: 'Learn Guides & Examples | BeautifulGrid',
    indexDescription: 'Explore runnable examples and practical tutorials covering BeautifulGrid setup, editing, sorting, filtering, virtual scrolling, pivoting, and more.',
    indexHeading: 'Learn BeautifulGrid through working examples',
    indexIntro: 'Explore live DataGrid demos, copy-ready source code, and practical implementation guidance in one place.',
    categories: {
      'getting-started': 'Getting Started',
      'data-and-columns': 'Data & Columns',
      interaction: 'Interaction & Editing',
      advanced: 'Advanced Features',
      'styling-and-accessibility': 'Styling & Accessibility',
    },
    guideCount: (count: number) => `${count} ${count === 1 ? 'guide' : 'guides'}`,
    details: 'View guide & source',
    demoOnly: 'Open demo',
    demoOnlyTitle: 'Open the standalone demo in a new tab',
    overview: 'Learn overview',
    navigation: 'Learn navigation',
    breadcrumb: 'Breadcrumb',
    previous: 'Previous guide',
    next: 'Next guide',
    pagination: 'Learn pagination',
    reviewedAt: 'Last reviewed',
    relatedApi: 'Related API',
    liveDemoSection: 'Live demo',
    sourceSection: 'Example source code',
    relatedGuides: 'Related guides',
    readMore: 'Read guide',
    interactiveExample: (title: string) => `${title} interactive example`,
    reset: 'Reset',
    resetTitle: 'Reset the demo to its initial state',
    resetAria: 'Reset demo',
    demoOnlyActionTitle: 'Open the Grid-only demo in a new tab',
    demoOnlyAria: (title: string) => `Open the ${title} standalone demo in a new tab`,
    demoErrorHeading: 'The demo could not be rendered',
    unknownError: 'Unknown error',
    manifestError: 'Error',
    missingManifest: 'No matching entry exists in the demo manifest.',
    sourceTabs: 'Example source code file tabs',
    copyTitle: 'Copy code to the clipboard',
    copyAria: 'Copy source code',
    copy: 'Copy',
    copied: 'Copied!',
    copyFailed: 'Failed',
    githubTitle: 'View the original file on GitHub',
    githubAria: 'Open the original file on GitHub',
    sourceUnavailable: '// Source code is unavailable.',
  },
} as const;

export function learnSlug(id: string): string {
  return id.replace(/^en\//, '').replace(/\.(md|mdx)$/, '');
}

export function learnPath(slug: string, locale: Locale): string {
  return localizePath(`/learn/${slug}`, locale);
}

export function learnIndexPath(locale: Locale): string {
  return localizePath('/learn', locale);
}

export function learnDemoPath(slug: string, _locale: Locale): string {
  return `/demo/${slug}`;
}

export function categoryLabel(category: string, locale: Locale): string {
  return learnMessages[locale].categories[category as keyof typeof learnMessages.ko.categories] || category;
}
