import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ExampleModule = { default: React.ComponentType };

const editingExamples: Array<[string, () => Promise<ExampleModule>]> = [
  ['basic editing', () => import('../examples/BasicEditingExample')],
  ['built-in editors', () => import('../examples/BuiltInEditorsExample')],
  ['external editor plugin', () => import('../examples/ExternalEditorPluginExample')],
  ['external shadcn editor plugin', () => import('../examples/ExternalShadcnEditorPluginExample')],
  ['editor icons', () => import('../examples/EditorIconExample')],
  ['lookup editor', () => import('../examples/LookupEditorExample')],
  ['editing events', () => import('../examples/EditingEventsExample')],
  ['merged cell editing', () => import('../examples/MergedCellEditingExample')],
];

async function renderExample(load: () => Promise<ExampleModule>) {
  const { default: Example } = await load();
  const result = render(<Example />);

  await waitFor(() => {
    expect(result.container.querySelector("[role='grid']")).toBeInTheDocument();
  });

  return result;
}

function expectGridShell(container: HTMLElement) {
  expect(container.querySelector("[role='rfdg-header-container']")).toBeInTheDocument();
  expect(container.querySelector("[role='rfdg-scroll-container']")).toBeInTheDocument();
  expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
}

async function selectAntdOption(combobox: HTMLElement, optionLabel: string) {
  const selector = combobox.closest('.ant-select')?.querySelector('.ant-select-selector');
  expect(selector).toBeInTheDocument();
  fireEvent.mouseDown(selector as HTMLElement);
  const options = await screen.findAllByText(optionLabel, { selector: '.ant-select-item-option-content' });
  fireEvent.click(options[options.length - 1]);
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1600);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(400);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('demo examples render intended grid features', () => {
  it.each(editingExamples)('%s distinguishes editable cells with vertical borders', async (_name, load) => {
    const { container } = await renderExample(load);

    expect(container.querySelector('.bgrid-body-vertical-bordered')).toBeInTheDocument();
    expect(container.querySelector('td.editing-example-cell-editable')).toBeInTheDocument();
    expect(container.querySelector('td.editing-example-cell-readonly')).toBeInTheDocument();
  });

  it('formats the idle Date column while preserving the date editor value format', async () => {
    const { container } = await renderExample(() => import('../examples/BuiltInEditorsExample'));

    expect(container).toHaveTextContent('2026.08.25');
    expect(container).not.toHaveTextContent('2026-08-25');
  });

  it('demonstrates checkbox cells and header-level bulk control in the built-in editor example', async () => {
    const { getByRole } = await renderExample(() => import('../examples/BuiltInEditorsExample'));

    const headerCheckbox = getByRole('checkbox', { name: '승인 권한 전체 선택' });
    expect(headerCheckbox).toHaveAttribute('aria-checked', 'mixed');
    expect(getByRole('checkbox', { name: 'ORD-2602 승인 권한' })).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(headerCheckbox);

    await waitFor(() => {
      expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
      expect(getByRole('checkbox', { name: 'ORD-2602 승인 권한' })).toHaveAttribute('aria-checked', 'true');
      expect(getByRole('checkbox', { name: 'ORD-2604 승인 권한' })).toHaveAttribute('aria-checked', 'true');
    });
  });

  it.each([
    [2, 'Ant Design 주문 상태 선택', '.bgrid-antd-select-editor'],
    [3, 'Ant Design 납기일 선택', '.bgrid-antd-date-editor'],
    [4, 'Ant Design 라벨 색상 선택', '.bgrid-antd-color-editor'],
    [5, 'Ant Design 분류 경로 선택', '.bgrid-antd-cascader-editor'],
    [6, 'Ant Design 배송 시간 선택', '.bgrid-antd-time-editor'],
    [7, 'Ant Design 담당 조직 선택', '.bgrid-antd-tree-select-editor'],
  ])('opens the external editor plugin in column %s', async (columnIndex, ariaLabel, editorSelector) => {
    const { container } = await renderExample(() => import('../examples/ExternalEditorPluginExample'));
    const cell = container.querySelector(
      `td[data-row-index="0"][data-column-index="${columnIndex}"]`,
    ) as HTMLElement;

    fireEvent.click(cell);
    expect(container.querySelector(editorSelector)).not.toBeInTheDocument();

    fireEvent.doubleClick(cell);

    await waitFor(() => {
      const editor = container.querySelector(editorSelector);
      expect(editor).toBeInTheDocument();
      expect(editor?.matches(`[aria-label="${ariaLabel}"]`) || editor?.querySelector(`[aria-label="${ariaLabel}"]`)).toBeTruthy();
      expect(editor?.closest('.bgrid-cell-content')).toHaveClass('bgrid-cell-content-plugin-editor');
    });
  });

  it('opens the external ColorPicker when its color swatch is clicked', async () => {
    const { container } = await renderExample(() => import('../examples/ExternalEditorPluginExample'));
    const colorSwatchButton = container.querySelector(
      'button.bgrid-editor-icon[aria-label="Ant Design 라벨 색상 선택"]',
    ) as HTMLButtonElement;

    fireEvent.click(colorSwatchButton);

    await waitFor(() => {
      expect(container.querySelector('.bgrid-antd-color-editor')).toBeInTheDocument();
    });
  });

  it.each([
    [2, 'Shadcn UI 주문 상태 선택'],
    [3, 'Shadcn UI 납기일 선택'],
    [4, 'Shadcn UI 라벨 색상 선택'],
    [5, 'Shadcn UI 분류 경로 선택'],
    [6, 'Shadcn UI 배송 시간 선택'],
    [7, 'Shadcn UI 담당 조직 선택'],
  ])('opens the Shadcn UI editor plugin in column %s', async (columnIndex, ariaLabel) => {
    const { container } = await renderExample(() => import('../examples/ExternalShadcnEditorPluginExample'));
    const cell = container.querySelector(
      `td[data-row-index="0"][data-column-index="${columnIndex}"]`,
    ) as HTMLElement;

    fireEvent.doubleClick(cell);

    await waitFor(() => {
      const trigger = container.querySelector(`button[aria-label="${ariaLabel}"]`);
      expect(trigger).toBeInTheDocument();
      expect(trigger?.closest('.bgrid-cell-content')).toHaveClass('bgrid-cell-content-plugin-editor');
    });
  }, 15_000);

  it('commits a Shadcn UI Select option before its popup closes', async () => {
    const { container } = await renderExample(() => import('../examples/ExternalShadcnEditorPluginExample'));
    const statusCell = container.querySelector(
      'td[data-row-index="0"][data-column-index="2"]',
    ) as HTMLTableCellElement;

    expect(statusCell).toHaveTextContent('접수');
    fireEvent.doubleClick(statusCell);

    const option = await screen.findByRole('option', { name: '진행' });
    fireEvent.pointerDown(option, { pointerType: 'mouse' });
    fireEvent.pointerUp(option, { pointerType: 'mouse' });

    await waitFor(() => {
      expect(statusCell).toHaveTextContent('진행');
      expect(container.querySelector('.bgrid-plugin-editor-host')).not.toBeInTheDocument();
    });
  }, 15_000);

  it.each([
    ['Ant Design', () => import('../examples/ExternalEditorPluginExample'), 'Ant Design 분류 경로 선택'],
    ['Shadcn UI', () => import('../examples/ExternalShadcnEditorPluginExample'), 'Shadcn UI 분류 경로 선택'],
  ])('%s Cascader preserves its array value after copying and pasting', async (_name, load, ariaLabel) => {
    const { container } = await renderExample(load);
    const sourceCell = container.querySelector(
      'td[data-row-index="0"][data-column-index="5"]',
    ) as HTMLTableCellElement;
    const targetCell = container.querySelector(
      'td[data-row-index="1"][data-column-index="5"]',
    ) as HTMLTableCellElement;
    const clipboardData = { setData: vi.fn() };

    fireEvent.pointerDown(sourceCell, { button: 0 });
    fireEvent.pointerUp(sourceCell);
    fireEvent.copy(document, { clipboardData });
    expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', '["국내","서울"]');

    fireEvent.pointerDown(targetCell, { button: 0 });
    fireEvent.pointerUp(targetCell);
    fireEvent.paste(document, {
      clipboardData: { getData: vi.fn().mockReturnValue('["국내","서울"]') },
    });

    await waitFor(() => expect(targetCell).toHaveTextContent('국내 / 서울'));
    fireEvent.doubleClick(targetCell);

    await waitFor(() => {
      const editor = container.querySelector(`[aria-label="${ariaLabel}"]`);
      expect(editor).toBeInTheDocument();
      expect(editor?.closest('.bgrid-cell-content')).toHaveTextContent('국내 / 서울');
    });
  }, 15_000);

  it('uses Ant Design autocomplete and confirms a radio-selected lookup row from the modal', async () => {
    const { container, getByLabelText } = await renderExample(() => import('../examples/LookupEditorExample'));
    const customerNameCell = container.querySelector(
      'td[data-row-index="0"][data-column-index="2"]',
    ) as HTMLTableCellElement;

    fireEvent.click(customerNameCell);

    expect(container.querySelector('.lookup-editor-autocomplete.ant-select')).not.toBeInTheDocument();
    expect(document.querySelector('.lookup-editor-autocomplete-popup.ant-select-dropdown')).not.toBeInTheDocument();

    fireEvent.doubleClick(customerNameCell);

    await waitFor(() => {
      expect(container.querySelector('.lookup-editor-autocomplete.ant-select')).toBeInTheDocument();
      expect(document.querySelector('.lookup-editor-autocomplete-popup.ant-select-dropdown')).toBeInTheDocument();
    });

    const autocompleteInput = container.querySelector(
      'input[aria-label="고객 자동완성"]',
    ) as HTMLInputElement;
    fireEvent.keyDown(autocompleteInput, { key: 'Escape' });
    await waitFor(() => expect(container.querySelector('.lookup-editor-autocomplete')).not.toBeInTheDocument());

    fireEvent.click(getByLabelText('ORD-2601 고객 lookup 열기'));

    const dialog = await screen.findByRole('dialog', { name: '고객 선택' });
    const dialogQueries = within(dialog);
    const searchInput = dialogQueries.getByLabelText('고객 검색');
    expect(dialog.querySelector("[role='grid']")).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'North' } });

    await waitFor(() => {
      expect(dialogQueries.getAllByRole('radio')).toHaveLength(1);
      expect(dialog).toHaveTextContent('Northwind');
    });

    fireEvent.click(dialogQueries.getByRole('radio'));
    fireEvent.click(dialogQueries.getByRole('button', { name: '확인' }));

    await waitFor(() => {
      expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')).toHaveTextContent('C003');
      expect(container.querySelector('td[data-row-index="0"][data-column-index="2"]')).toHaveTextContent('Northwind');
      expect(container.querySelector('td[data-row-index="0"][data-column-index="3"]')).toHaveTextContent('일반');
      expect(screen.queryByRole('dialog', { name: '고객 선택' })).not.toBeInTheDocument();
    });
  }, 15_000);

  it('keeps editing event history inside a fixed terminal-style scroll region', async () => {
    const { container } = await renderExample(() => import('../examples/EditingEventsExample'));
    const eventLog = container.querySelector('.editing-events-log');

    expect(container.querySelector('.editing-events-terminal')).toBeInTheDocument();
    expect(eventLog).toHaveAttribute('role', 'log');
    expect(eventLog).toHaveAttribute('aria-live', 'polite');
    expect(eventLog).toHaveTextContent('편집을 시작하면 이벤트가 여기에 기록됩니다.');
  });

  it('lets users configure frozen rows and columns while preserving merged editing', async () => {
    const { container, getByRole } = await renderExample(() => import('../examples/MergedCellEditingExample'));
    const frozenColumnSelect = getByRole('combobox', { name: '고정할 컬럼 수' });
    const frozenRowSelect = getByRole('combobox', { name: '고정할 행 수' });

    expect(frozenColumnSelect.closest('.ant-select')).toHaveTextContent('0개');
    expect(frozenRowSelect.closest('.ant-select')).toHaveTextContent('0개');
    expect(frozenColumnSelect).toHaveAttribute('aria-describedby', 'merged-frozen-column-help');
    expect(frozenRowSelect).toHaveAttribute('aria-describedby', 'merged-frozen-row-help');
    expect(container).toHaveTextContent('왼쪽 고정 컬럼 수');
    expect(container).toHaveTextContent('1개는 ‘주문 코드’만');
    expect(container).toHaveTextContent('위쪽 고정 행 수');
    expect(container).toHaveTextContent('1~2개는 첫 3행 병합 셀을 고정·스크롤 영역으로 나누고');
    expect(container).toHaveTextContent('일반 병합');
    expect(container).toHaveTextContent('24 Items');
    expect(container.querySelector('.bgrid-frozen-rows-layer')).not.toBeInTheDocument();
    expect(
      container.querySelector('td[data-row-index="0"][data-column-index="0"] > .bgrid-cell-content > .bgrid-cell-value'),
    ).toBeInTheDocument();

    const mergedCell = container.querySelector(
      'td[data-row-index="0"][data-column-index="1"]',
    ) as HTMLTableCellElement;
    fireEvent.click(mergedCell);

    const editor = container.querySelector(
      '.bgrid-text-editor-gateway.bgrid-text-editor-active',
    ) as HTMLInputElement;
    fireEvent.change(editor, { target: { value: '일반 병합 편집 완료' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => expect(container).toHaveTextContent('마지막 트랜잭션의 변경 행: 1, 2, 3'));

    await selectAntdOption(frozenColumnSelect, '2개');
    await selectAntdOption(frozenRowSelect, '1개');

    await waitFor(() => {
      expect(container.querySelector('[data-merge-layout="frozen-boundary"]')).toBeInTheDocument();
      expect(container.querySelector('.bgrid-frozen-rows-layer')).toBeInTheDocument();
      expect(container).toHaveTextContent('고정 경계 병합');
      expect(frozenColumnSelect.closest('.ant-select')).toHaveTextContent('2개');
      expect(frozenRowSelect.closest('.ant-select')).toHaveTextContent('1개');
    });

    const frozenFragment = container.querySelector(
      '[data-bgrid-quadrant="top-left"] td[data-row-index="0"][data-column-index="1"]',
    );
    const scrollableFragment = container.querySelector(
      '[data-bgrid-quadrant="body-left"] td[data-row-index="1"][data-column-index="1"]',
    );
    expect(frozenFragment).toBeInTheDocument();
    expect(frozenFragment).not.toHaveAttribute('rowspan');
    expect(scrollableFragment).toHaveAttribute('rowspan', '2');
    expect(
      container.querySelector('[data-bgrid-quadrant="body-left"] td[data-row-index="2"][data-column-index="1"]'),
    ).not.toBeInTheDocument();

    fireEvent.click(scrollableFragment!);
    await waitFor(() => {
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="body-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).toBeInTheDocument();
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="top-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).not.toBeInTheDocument();
    });

    const splitEditor = container.querySelector(
      '.bgrid-text-editor-gateway.bgrid-text-editor-active',
    ) as HTMLInputElement;
    fireEvent.change(splitEditor, { target: { value: '분리 조각 편집 완료' } });
    fireEvent.keyDown(splitEditor, { key: 'Enter' });

    await waitFor(() => {
      expect(frozenFragment).toHaveTextContent('분리 조각 편집 완료');
      expect(scrollableFragment).toHaveTextContent('분리 조각 편집 완료');
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="body-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).toBeInTheDocument();
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="top-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).not.toBeInTheDocument();
    });

    fireEvent.click(frozenFragment!);
    await waitFor(() => {
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="top-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).toBeInTheDocument();
      expect(
        container.querySelector(
          '[data-bgrid-selection-quadrant="body-left"] [data-bgrid-active-fragment="true"]',
        ),
      ).not.toBeInTheDocument();
    });
  });

  it('preserves the edited-cell state when an editing example synchronizes controlled data', async () => {
    const { container, getByLabelText } = await renderExample(() => import('../examples/BuiltInEditorsExample'));
    const cellSelector = 'td[data-row-index="0"][data-column-index="1"]';
    const cell = container.querySelector(cellSelector) as HTMLElement;

    fireEvent.doubleClick(cell);
    const editor = getByLabelText('행 1, 열 2 텍스트 편집') as HTMLInputElement;
    await waitFor(() => expect(editor).toHaveClass('bgrid-text-editor-active'));

    fireEvent.input(editor, { target: { value: '변경 고객' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => {
      const editedCell = container.querySelector(cellSelector);
      expect(editedCell).toHaveClass('bgrid-cell-edited');
      expect(editedCell).toHaveAttribute('data-bgrid-cell-edited', 'true');
      expect(editedCell).toHaveTextContent('변경 고객');
    });
  });

  it('renders BasicExample as an order fulfillment exception workflow', async () => {
    const { container } = await renderExample(() => import('../examples/BasicExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('주문 출고 예외 관리');
    expect(container).toHaveTextContent('주문번호');
    expect(container).toHaveTextContent('ACME 리테일');
    expect(container).toHaveTextContent('출고 보류');
    expect(container).toHaveTextContent('검토 선택 0건');
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
    expect(container.querySelector('.bgrid-line-number-cell')).toBeInTheDocument();
  });

  it('renders itemRender Canvas cells and keeps cell actions independent from row selection', async () => {
    const { container, getByRole } = await renderExample(() => import('../examples/ItemRenderExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('셀 안에 운영 대시보드를 구성합니다');
    expect(container).toHaveTextContent('서울 동부 센터');
    expect(container.querySelectorAll('canvas[role="img"]')).toHaveLength(16);

    fireEvent.click(getByRole('button', { name: '김포 허브 알림 2건 확인 처리' }));

    await waitFor(() => {
      expect(container).not.toHaveTextContent('알림 2건 확인');
      expect(container).toHaveTextContent('이상 없음');
      expect(container.querySelector('.item-render-example__filter b')).toHaveTextContent('3');
      expect(container).toHaveTextContent('행을 선택하면 센터 정보가 표시됩니다.');
    });

    fireEvent.click(getByRole('button', { name: /이상 거점만 보기/ }));

    await waitFor(() => {
      expect(container).toHaveTextContent('3개 거점 · 이상 대응 대상');
      expect(container).not.toHaveTextContent('서울 동부 센터');
      expect(container.querySelectorAll('canvas[role="img"]')).toHaveLength(6);
    });
  });

  it('renders LineNumberExample with realistic large data and a four-digit line-number width', async () => {
    const { container } = await renderExample(() => import('../examples/LineNumberExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
    expect(container.querySelector('.bgrid-line-number-cell')).toBeInTheDocument();
    expect(container).toHaveTextContent('주문번호');
    expect(container).toHaveTextContent('에이원 리테일');
    expect(container).toHaveTextContent('2,500 Items');
    expect(container.querySelector("[role='rfdg-frozen-scroll-container'] col")).toHaveAttribute('width', '50');
  });

  it('renders ColumnsGroupExample with grouped headers and changes the frozen boundary', async () => {
    const { container, getByRole } = await renderExample(() => import('../examples/ColumnsGroupExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-frozen-header']")).toBeInTheDocument();
    expect(container).toHaveTextContent('주문 현황');
    expect(container).toHaveTextContent('고객 상세');
    expect(container.querySelectorAll("[role='rfdg-head'] > tr")).toHaveLength(4);

    const frozenBoundarySelect = getByRole('combobox', { name: '틀고정 위치' });
    expect(frozenBoundarySelect.closest('.ant-select')).toHaveTextContent('4개 · 상품 뒤');
    await selectAntdOption(frozenBoundarySelect, '고정 없음');

    await waitFor(() => {
      expect(frozenBoundarySelect.closest('.ant-select')).toHaveTextContent('고정 없음');
      expect(container.querySelectorAll("[role='rfdg-head-frozen'] [data-column-index]")).toHaveLength(0);
    });
    expect(container).toHaveTextContent('현재는 고정 컬럼 없이 모든 컬럼이 함께 스크롤됩니다.');
  });

  it('renders SortExample with row selection and sortable headers', async () => {
    const { container } = await renderExample(() => import('../examples/SortExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('Nation');
    expect(container.querySelector('.bgrid-sorter')).toBeInTheDocument();
    expect(container.querySelector('.bgrid-row-selector')).toBeInTheDocument();
  });

  it('renders CheckedExample with checkbox/radio selection UI', async () => {
    const { container } = await renderExample(() => import('../examples/CheckedExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('Nation');
    const selectedKeys = screen.getByTestId('checked-row-keys');
    expect(selectedKeys).toHaveTextContent('선택한 키 (0)');
    expect(selectedKeys).toHaveTextContent('없음');

    const rowCheckboxes = screen.getAllByRole('checkbox');
    fireEvent.click(rowCheckboxes[1]);
    fireEvent.click(rowCheckboxes[2]);

    await waitFor(() => {
      expect(selectedKeys).toHaveTextContent('선택한 키 (2)');
      expect(selectedKeys).toHaveTextContent('대한민국(15+ LFS)');
      expect(selectedKeys).toHaveTextContent('아르메니아(15~75 LFS)');
    });

    fireEvent.click(screen.getByText('Radio (단일 선택)'));

    await waitFor(() => {
      expect(screen.getAllByRole('radio').length).toBeGreaterThan(0);
      expect(selectedKeys).toHaveTextContent('선택한 키 (1)');
      expect(selectedKeys).toHaveTextContent('대한민국(15+ LFS)');
      expect(selectedKeys).not.toHaveTextContent('아르메니아(15~75 LFS)');
    });
  }, 30_000);

  it('renders PagingExample with footer pagination', async () => {
    const { container } = await renderExample(() => import('../examples/PagingExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-footer-container']")).toBeInTheDocument();
    expect(container).toHaveTextContent('회원번호');
    expect(container).toHaveTextContent('MBR-000001');
    expect(container).toHaveTextContent('member0001@example.com');
    expect(container).toHaveTextContent('498 Items');

    const pageTwo = Array.from(container.querySelectorAll("[role='page-number']")).find(
      pageNumber => pageNumber.textContent?.trim() === '2',
    );
    expect(pageTwo).toBeInTheDocument();
    fireEvent.click(pageTwo!);

    await waitFor(() => {
      expect(container).toHaveTextContent('MBR-000051');
      expect(container).not.toHaveTextContent('MBR-000001');
    });
  });

  it('renders PivotExample with aggregate-aware value formatting', async () => {
    const { container, getAllByRole } = await renderExample(() => import('../examples/PivotExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('Rows');
    expect(container).toHaveTextContent('Columns');
    expect(container).toHaveTextContent('Values');
    expect(container).toHaveTextContent('Q1');
    expect(container).toHaveTextContent('Sum Sales');
    expect(container).toHaveTextContent('$');

    const aggregateSelect = getAllByRole('combobox')[3];
    await selectAntdOption(aggregateSelect, 'Count');

    await waitFor(() => {
      expect(container).toHaveTextContent('Count Sales');
      expect(container).toHaveTextContent('6');
      expect(container).not.toHaveTextContent('$6');
    });
  });

  it('renders LoadingExample with product API loading and empty-result controls', async () => {
    const { container, getByText } = await renderExample(() => import('../examples/LoadingExample'));

    expectGridShell(container);
    expect(getByText('전체 로딩 시작')).toBeInTheDocument();
    expect(getByText('그리드 처리 시작')).toBeInTheDocument();
    expect(container).toHaveTextContent('SKU-00001');
    expect(container).toHaveTextContent('프리미엄 무선 키보드');

    fireEvent.click(getByText('빈 검색 결과'));
    await waitFor(() => expect(container).toHaveTextContent('조회 조건에 일치하는 상품이 없습니다.'));

    fireEvent.click(getByText('상품 데이터 복원'));
    await waitFor(() => expect(container).toHaveTextContent('SKU-00001'));
  });

  it('renders FocusExample and applies active row after clicking a row', async () => {
    const { container } = await renderExample(() => import('../examples/FocusExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('선택 문서: 없음');
    expect(container).toHaveTextContent('신규 입사자 계정 발급 절차');

    const firstBodyCell = container.querySelector("[role='rfdg-body'] td:not([data-none])") as HTMLTableCellElement;
    expect(firstBodyCell).toBeTruthy();
    fireEvent.click(firstBodyCell);

    await waitFor(() => {
      expect(container.querySelector('tr.bgrid-row-active')).toBeInTheDocument();
      expect(container.querySelector('[data-testid="selected-article"]')).toHaveTextContent(
        '신규 입사자 계정 발급 절차',
      );
    });
  });

  it('renders FrozenColumnsExample and changes frozen rows, columns, and summary placement', async () => {
    const { container, getByLabelText, getByRole } = await renderExample(() => import('../examples/FrozenColumnsExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();

    await selectAntdOption(getByRole('combobox', { name: '고정할 컬럼 수' }), '0개');

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-body-frozen'] td[data-column-index]")).not.toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-body-frozen'] .bgrid-line-number-cell")).toBeInTheDocument();
      expect(container).toHaveTextContent(
        'Summary 상단 표시 · Summary 다음 줄부터 2개 행, 왼쪽 0개 컬럼을 고정합니다.',
      );
    });

    await selectAntdOption(getByRole('combobox', { name: '고정할 행 수' }), '0개');

    await waitFor(() => {
      expect(container.querySelector('[data-bgrid-row-band="frozen"]')).not.toBeInTheDocument();
      expect(container).toHaveTextContent(
        'Summary 상단 표시 · Summary 다음 줄부터 0개 행, 왼쪽 0개 컬럼을 고정합니다.',
      );
    });

    expect(container).toHaveTextContent('인력 요약');
    expect(container).toHaveTextContent('4개 부서');
    expect(container).toHaveTextContent('평균 80%');

    const summaryLabelCell = Array.from(container.querySelectorAll('[role^="rfdg-summ"] td')).find(cell =>
      cell.textContent?.includes('인력 요약'),
    ) as HTMLTableCellElement;
    expect(summaryLabelCell.style.textAlign).toBe('center');

    await selectAntdOption(getByRole('combobox', { name: 'Summary 위치' }), '하단');
    await waitFor(() => {
      expect(container).toHaveTextContent('Summary 하단 표시 · 첫 데이터 행부터');
      const summaryBand = container.querySelector('[role="rfdg-summary-container"]') as HTMLElement;
      const bodyBand = container.querySelector('.bgrid-body-scroll-content') as HTMLElement;
      expect(bodyBand.compareDocumentPosition(summaryBand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    fireEvent.click(getByLabelText('Summary 표시'));
    await waitFor(() => {
      expect(container.querySelector('[role="rfdg-summary-container"]')).not.toBeInTheDocument();
      expect(container).toHaveTextContent('Summary 숨김 · 첫 데이터 행부터');
      expect(getByRole('combobox', { name: 'Summary 위치' })).toBeDisabled();
    });
  });

  it('renders EditorExample with editor controls and frozen editable grid', async () => {
    const { container, getByText } = await renderExample(() => import('../examples/EditorExample'));

    expectGridShell(container);
    expect(getByText('편집 시작')).toBeInTheDocument();
    expect(getByText('행 추가')).toBeInTheDocument();
    expect(getByText('변경 커밋')).toBeInTheDocument();
    expect(container).toHaveTextContent('내장 text');
    expect(container).toHaveTextContent('기본 plugin');
    expect(container).toHaveTextContent('AntD plugin');
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
    expect(container.querySelector('.bgrid-line-number-cell')).toBeInTheDocument();
  });

  it('renders CellNavigationExample with keyboard controls and moves the active cell', async () => {
    const { container, getByText } = await renderExample(() => import('../examples/CellNavigationExample'));

    expectGridShell(container);
    expect(getByText('키보드 이동')).toBeInTheDocument();
    expect(getByText('범위 선택')).toBeInTheDocument();
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
    expect(container.querySelector('td.merged')).toBeInTheDocument();
    expect(container.querySelector('.bgrid-body-vertical-bordered')).toBeInTheDocument();

    const grid = container.querySelector("[role='grid']") as HTMLElement;
    grid.focus();
    fireEvent.keyDown(grid, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(container).toHaveTextContent('활성 셀: 행 1, 열 3');
      expect(container.querySelector('td[data-row-index="0"][data-column-index="2"]')).toHaveClass('bgrid-cell-active');
    });

    fireEvent.keyDown(grid, { key: 'Enter' });

    await waitFor(() => {
      expect(container).toHaveTextContent('마지막 클릭 활성화: A-2401 · 행 1, 열 3 (분류 · 병합)');
      expect(container).toHaveTextContent('활성 셀: 행 1, 열 3');
    });
  });

  it('keeps row indexes consistent while virtualizing the 1M-row example', async () => {
    const { container } = await renderExample(() => import('../examples/ScrollExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('주문 번호');
    expect(container).toHaveTextContent('고객사');
    expect(container).toHaveTextContent('주문 금액');
    expect(container).toHaveTextContent('전체 1,000,000건');
    expect(container.querySelector("[role='rfdg-body-frozen'] .bgrid-line-number-cell")).toHaveTextContent('1');
    expect(container.querySelectorAll("[role='rfdg-body'] tr").length).toBeLessThan(100);

    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    const scrollPlane = container.querySelector('.bgrid-scroll-plane') as HTMLDivElement;
    expect(scrollPlane).toHaveAttribute('data-bgrid-virtual-scroll-window', 'true');
    expect(Number(scrollPlane.dataset.bgridPhysicalHeight)).toBeLessThan(Number(scrollPlane.dataset.bgridLogicalHeight));
    expect(Number(scrollPlane.dataset.bgridPhysicalHeight)).toBeLessThanOrEqual(1_000_000);

    scrollContainer.scrollTop = 2900;
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      const firstVisibleLineNumber = container.querySelector(
        "[role='rfdg-body-frozen'] .bgrid-line-number-cell",
      ) as HTMLTableCellElement;
      const displayedLineNumber = Number(firstVisibleLineNumber.textContent);

      expect(displayedLineNumber).toBeGreaterThan(1);
      expect(firstVisibleLineNumber).toHaveAttribute('data-row-index', String(displayedLineNumber - 1));
      expect(container.querySelectorAll("[role='rfdg-body'] tr").length).toBeLessThan(100);
    });

    for (let index = 0; index < 70; index += 1) {
      const previousBase = Number(scrollPlane.dataset.bgridVirtualScrollBase ?? 0);
      scrollContainer.scrollTop = 900_000;
      fireEvent.scroll(scrollContainer);

      await waitFor(() => {
        expect(Number(scrollPlane.dataset.bgridVirtualScrollBase ?? 0)).toBeGreaterThan(previousBase);
      });
    }

    scrollContainer.scrollTop = 1_000_000;
    fireEvent.scroll(scrollContainer);

    await waitFor(() => {
      const renderedLineNumbers = Array.from(
        container.querySelectorAll("[role='rfdg-body-frozen'] .bgrid-line-number-cell"),
      ).map(cell => Number(cell.textContent));

      expect(renderedLineNumbers).toContain(1_000_000);
      expect(container.querySelectorAll("[role='rfdg-body'] tr").length).toBeLessThan(100);
      expect(Number(scrollPlane.dataset.bgridLogicalScrollTop)).toBeGreaterThan(28_000_000);
    });
  }, 30000);

  it('renders GetRowClassName example with custom row classes', async () => {
    const { container } = await renderExample(() => import('../examples/GetRowClassName'));

    expectGridShell(container);
    expect(container).toHaveTextContent('재고');
    expect(container).toHaveTextContent('품절 · 긴급 발주');
    expect(container.querySelector('tr.row-out-of-stock')).toBeInTheDocument();
    expect(container.querySelector('tr.row-low-stock')).toBeInTheDocument();
  });

  it('renders CellMergeExample with merged cells and frozen column', async () => {
    const { container } = await renderExample(() => import('../examples/CellMergeExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toBeInTheDocument();
    expect(container.querySelector('td.merged')).toBeInTheDocument();
    expect(container).toHaveTextContent('가전/디지털');
    expect(container).toHaveTextContent('컴퓨터 주변기기');
    expect(container).toHaveTextContent('프리미엄 무선 키보드');
  });

  it('renders SummaryExample with top summary row', async () => {
    const { container, getByText } = await renderExample(() => import('../examples/SummaryExample'));

    expectGridShell(container);
    expect(container.querySelector("[role='rfdg-summary-container']")).toBeInTheDocument();
    expect(container).toHaveTextContent('상단 매출 합계 · 30건');
    expect(container).toHaveTextContent('공급가액');
    expect(container).toHaveTextContent('결제금액');

    fireEvent.click(getByText('하단 요약'));
    await waitFor(() => expect(container).toHaveTextContent('하단 매출 합계 · 30건'));
  });

  it('renders ColumnSortExample with draggable header sorting setup', async () => {
    const { container } = await renderExample(() => import('../examples/ColumnSortExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('Nation');
    expect(container.querySelector("[role='rfdg-head']")).toBeInTheDocument();
  });

  it('reorders rows by dragging the line-number handle', async () => {
    const { container } = await renderExample(() => import('../examples/ReorderExample'));

    expectGridShell(container);
    const handle = container.querySelector('.drag-handle') as HTMLTableCellElement;
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    Object.defineProperty(scrollContainer, 'scrollTop', { configurable: true, writable: true, value: 0 });
    scrollContainer.getBoundingClientRect = () =>
      ({ top: 0, bottom: 180, left: 0, right: 600, width: 600, height: 180, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;

    expect(handle).toBeInTheDocument();
    expect(container).toHaveTextContent('배너 제목');
    expect(container).toHaveTextContent('여름 시즌 최대 40% 프로모션');

    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 14 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 102 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 102 });

    await waitFor(() => {
      const ids = Array.from(container.querySelectorAll("tbody[role='rfdg-body'] tr.bgrid-body-row"))
        .slice(0, 4)
        .map(row => row.querySelector('td[data-column-index="0"]')?.textContent?.trim());
      expect(ids).toEqual(['BNR-002', 'BNR-003', 'BNR-004', 'BNR-001']);
    });
  });

  it('renders ToolboxExample with filter/sort toolbox buttons and query info', async () => {
    const { container } = await renderExample(() => import('../examples/ToolboxExample'));

    expectGridShell(container);
    expect(container).toHaveTextContent('React 18 새로운 기능 살펴보기');
    expect(container).toHaveTextContent('정렬:');
    expect(container).toHaveTextContent('필터:');
    expect(container.querySelectorAll('.bgrid-toolbox-trigger-btn').length).toBeGreaterThan(0);
  });
});
