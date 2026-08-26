# BeautifulGrid Site

Astro 기반의 제품 소개, 문서, 실행 예제, API, 비교 사이트입니다. 배포 라이브러리 소스는 상위의 `beautiful-grid/`에 있으며 이 디렉터리는 사이트 전용입니다.

## 작업 전 확인

- [`../docs/site-design-style-guide.md`](../docs/site-design-style-guide.md)
- [`../docs/demo-site-rebuild-development-directive.md`](../docs/demo-site-rebuild-development-directive.md)
- [`AGENTS.md`](./AGENTS.md)

## 명령

저장소 루트에서 실행합니다.

```bash
npm run site:dev
npm run site:check
npm run site:build
npm run site:test
```

임시 운영 배포 구조와 절차는 [`../docs/site-self-hosted-deployment.md`](../docs/site-self-hosted-deployment.md)를 확인합니다. 공개 주소는 `https://bgrid.axisj.com`입니다.

Astro 개발 서버를 직접 실행할 때는 `AGENTS.md`에 따라 background mode를 사용합니다.

## 주요 경로

- `src/pages/`: 정적·동적 route
- `src/layouts/`: Marketing, Docs, Demo, Comparison layout
- `src/components/`: 공통 shell과 React island
- `src/content/`: 문서와 예제 metadata
- `src/data/productFacts.ts`: 사이트가 표시하는 제품 사실의 단일 소스
- `src/styles/globals.css`: 사이트 semantic token과 공통 스타일

페이지 링크를 추가하기 전에 실제 route나 content slug가 존재하는지 확인하고, 제품 주장과 라이선스 문구를 임의로 만들지 않습니다.
