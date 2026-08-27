import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

export interface ApiReferenceMember {
  name: string;
  type: string;
  required: boolean;
  deprecated: boolean;
  description: string;
}

export interface ApiReferenceEntry {
  name: string;
  kind: 'interface' | 'type' | 'enum';
  group: string;
  summary: string;
  declaration: string;
  members: ApiReferenceMember[];
  sourceLine: number;
}

export interface ApiReferenceGroup {
  id: string;
  label: string;
  entries: ApiReferenceEntry[];
}

const groupDefinitions = [
  { id: 'core', label: '핵심 컴포넌트 타입' },
  { id: 'data', label: '데이터와 이벤트' },
  { id: 'query', label: '정렬·필터·툴박스' },
  { id: 'selection', label: '선택과 편집' },
  { id: 'layout', label: '레이아웃과 표시' },
  { id: 'reorder', label: '순서 변경' },
  { id: 'pivot', label: '피벗' },
] as const;

const typeMetadata: Record<string, { group: string; summary: string }> = {
  BGridProps: { group: 'core', summary: 'BGrid 컴포넌트에 전달하는 최상위 props입니다.' },
  BGridColumn: { group: 'core', summary: '한 개 데이터 컬럼의 키, 제목, 너비, 렌더링 및 편집 동작을 정의합니다.' },
  BGridColumnWithOptionalWidth: {
    group: 'core',
    summary: '최상위 columns prop에서 width를 생략할 수 있게 만든 컬럼 입력 타입입니다.',
  },
  BGridDataItem: { group: 'core', summary: '원본 행 값과 그리드 상태를 함께 전달하는 행 래퍼 타입입니다.' },
  BGridDataItemStatus: { group: 'core', summary: '행의 신규·수정·삭제 상태를 나타냅니다.' },
  BGridItemRenderProps: { group: 'core', summary: '컬럼 itemRender에 전달되는 셀 렌더링 컨텍스트입니다.' },
  BGridTextEditorContext: { group: 'selection', summary: 'text 편집기의 값 변환 함수에 전달되는 셀 컨텍스트입니다.' },
  BGridCheckboxEditorContext: {
    group: 'selection',
    summary: 'checkbox의 접근성 이름, 라벨과 비활성화 함수에 전달되는 행·셀 컨텍스트입니다.',
  },
  BGridTextEditorConfig: {
    group: 'selection',
    summary: '내장 text 편집기의 직접 입력, blur와 값 변환 동작을 설정합니다.',
  },
  BGridCheckboxEditorConfig: {
    group: 'selection',
    summary: '내장 checkbox의 값 매핑, 행별 비활성화와 헤더 일괄 제어를 설정합니다.',
  },
  BGridCheckboxHeaderConfig: {
    group: 'selection',
    summary: 'checkbox 컬럼 헤더의 접근성 이름과 일괄 제어 비활성화를 설정합니다.',
  },
  BGridEditTrigger: { group: 'selection', summary: '셀 영역에서 편집을 시작할 클릭 또는 더블클릭 조건입니다.' },
  BGridCellValueChange: {
    group: 'selection',
    summary: 'key 또는 columnId로 지정하는 한 컬럼의 변경 제안입니다.',
  },
  BGridCommitOptions: { group: 'selection', summary: 'commit 완료 뒤 활성 셀 이동을 설정합니다.' },
  BGridCellCommitController: {
    group: 'selection',
    summary: '변경 목록을 저장하거나 현재 편집 상호작용을 취소합니다.',
  },
  BGridEditSource: { group: 'selection', summary: '변경 요청을 시작한 text, checkbox, plugin, itemRender 또는 아이콘 경로입니다.' },
  BGridChangeValueRow: {
    group: 'selection',
    summary: '병합 셀 전파 대상 행과 변경 전후 값의 immutable preview입니다.',
  },
  BGridChangeValueParams: {
    group: 'selection',
    summary: '컬럼 onChangeValue에 전달되는 변경 제안, 행 범위 및 최종 commit controller입니다.',
  },
  BGridEditorIconParams: {
    group: 'selection',
    summary: 'editorIcon 렌더링에 전달되는 canonical 셀 문맥입니다.',
  },
  BGridEditorIconClickParams: {
    group: 'selection',
    summary: 'editorIcon callback에 전달되는 셀 문맥과 commit controller입니다.',
  },
  BGridEditorIconClickHandler: {
    group: 'selection',
    summary: '아이콘 편집 세션을 실행하고 선택적으로 cleanup을 반환하는 callback입니다.',
  },
  BGridEditorIconConfig: {
    group: 'selection',
    summary: '셀 값 옆 편집 아이콘의 모양, 표시 조건과 callback을 설정합니다.',
  },
  BGridEditorPluginProps: {
    group: 'selection',
    summary: '에디터 플러그인 component에 전달되는 셀 문맥과 편집 수명주기 함수입니다.',
  },
  BGridPluginEditorConfig: { group: 'selection', summary: '앱 전용 에디터 플러그인의 식별자와 component를 정의합니다.' },
  BGridCellEditorConfig: {
    group: 'selection',
    summary: '내장 text·checkbox 또는 plugin 편집기를 구분하는 컬럼 editor 설정입니다.',
  },
  BGridCellEditSession: { group: 'selection', summary: '현재 편집 셀과 시작 모드, 원래 값을 나타내는 편집 세션입니다.' },
  BGridChangeDataMeta: {
    group: 'data',
    summary: 'onChangeData에 전달되는 실제 변경 목록과 병합 트랜잭션 범위입니다.',
  },
  BGridCellClipboardTextParams: {
    group: 'core',
    summary: 'getClipboardText에서 복사 문자열을 만들 때 사용하는 셀 컨텍스트입니다.',
  },
  AlignDirection: { group: 'core', summary: '셀 또는 헤더 콘텐츠의 가로 정렬 방향입니다.' },
  MoveDirection: { group: 'core', summary: '편집 중 다음 셀로 이동할 방향입니다.' },
  BGridProcessedRow: { group: 'data', summary: '정렬·필터 처리 후 원본 인덱스를 보존하는 처리 행입니다.' },
  BGridPage: { group: 'data', summary: '페이지 번호, 크기, 전체 개수와 페이지 변경 콜백을 정의합니다.' },
  BGridRowChecked: { group: 'data', summary: '체크박스 또는 라디오 방식의 행 선택 상태와 변경 콜백입니다.' },
  CheckedAll: { group: 'data', summary: '전체 선택 상태를 선택·해제·부분 선택으로 표현합니다.' },
  BGridClickParams: { group: 'data', summary: '셀 클릭 콜백에 전달되는 행과 컬럼 정보입니다.' },
  BGridChangeColumnsInfo: { group: 'data', summary: '컬럼 너비나 순서 변경 뒤 전달되는 컬럼 상태입니다.' },
  BGridSortParam: { group: 'query', summary: '한 컬럼의 정렬 키와 방향입니다.' },
  BGridSortInfo: { group: 'query', summary: '제어형 정렬 상태와 변경 콜백입니다.' },
  BGridFilterOperator: { group: 'query', summary: '텍스트 및 숫자 필터에서 지원하는 비교 연산자입니다.' },
  BGridFilterValue: { group: 'query', summary: '값 목록 필터에서 사용할 수 있는 원시 값입니다.' },
  BGridFilterParam: { group: 'query', summary: '값·텍스트·숫자 필터 조건의 판별 유니온입니다.' },
  BGridDataQuery: { group: 'query', summary: '현재 적용된 정렬 및 필터 조건 전체입니다.' },
  BGridDataQueryChangeEvent: { group: 'query', summary: '데이터 쿼리가 변경된 원인과 대상 컬럼을 설명합니다.' },
  BGridDataControl: { group: 'query', summary: '클라이언트 처리 또는 수동 서버 처리 방식의 데이터 쿼리를 제어합니다.' },
  BGridColumnFilterConfig: { group: 'query', summary: '컬럼별 필터 형식, 값 추출 및 사용자 조건식을 정의합니다.' },
  BGridToolboxItem: { group: 'query', summary: '컬럼 툴박스에 추가할 사용자 작업 항목입니다.' },
  BGridToolboxRenderProps: { group: 'query', summary: '사용자 정의 컬럼 툴박스 렌더러에 전달되는 컨텍스트입니다.' },
  BGridToolboxIcons: { group: 'query', summary: '정렬·필터 툴박스의 아이콘을 교체하는 슬롯입니다.' },
  BGridToolboxConfig: { group: 'query', summary: '컬럼별 정렬·필터 툴박스 기능과 사용자 UI를 설정합니다.' },
  BGridSearchCellParams: { group: 'query', summary: '검색 문자열 getter에 전달되는 표시·원본 행과 셀 문맥입니다.' },
  BGridSearchOpenReason: { group: 'query', summary: '검색 UI 열림 상태가 변경된 사용자 또는 surface 원인입니다.' },
  BGridSearchIcons: { group: 'query', summary: '검색 입력과 이전·다음·닫기 버튼의 아이콘 슬롯입니다.' },
  BGridSearchLabels: { group: 'query', summary: '검색 UI의 접근 가능한 이름, 상태 문구와 결과 수 형식을 설정합니다.' },
  BGridSearchOptions: { group: 'query', summary: '현재 로드된 Grid 데이터의 셀 검색과 제어형 UI 상태를 설정합니다.' },
  BGridContextMenuTarget: { group: 'query', summary: '본문 셀 컨텍스트 메뉴에 전달되는 표시·원본 행과 셀 문맥입니다.' },
  BGridContextMenuItem: { group: 'query', summary: '본문 셀 메뉴의 실행 항목 또는 구분선을 정의합니다.' },
  BGridContextMenuOptions: { group: 'query', summary: '본문 셀에서 확장 가능한 컨텍스트 메뉴 항목을 구성합니다.' },
  BGridCellAddress: { group: 'selection', summary: '활성 셀의 절대 행·컬럼 인덱스를 나타냅니다.' },
  BGridCellMoveDirection: { group: 'selection', summary: '활성 셀을 이동할 키보드 방향과 경계 이동 종류입니다.' },
  BGridMoveActiveCellOptions: {
    group: 'selection',
    summary: '내부 셀 이동에서 범위 확장, 경계 이동과 페이지 크기를 설정합니다.',
  },
  BGridCellNavigationOptions: {
    group: 'selection',
    summary: '활성 셀의 제어 상태와 키보드 이동·편집·클릭 활성화 정책을 설정합니다.',
  },
  BGridCellSelectionRange: { group: 'selection', summary: '셀 선택 영역의 시작과 끝 행·컬럼 인덱스입니다.' },
  BGridCellSelectionCopyErrorReason: {
    group: 'selection',
    summary: '셀 복사가 실패한 원인을 구분하는 문자열 유니온입니다.',
  },
  BGridCellSelectionCopyError: { group: 'selection', summary: '셀 복사 제한 또는 Clipboard API 오류 정보입니다.' },
  BGridColumnGroup: { group: 'layout', summary: '기존 인덱스 범위 방식의 2단 그룹 헤더를 정의합니다.' },
  BGridColumnGroupNode: {
    group: 'layout',
    summary: '컬럼 ID와 자식 그룹을 재귀적으로 구성하는 임의 깊이 그룹 헤더 노드입니다.',
  },
  BGridCellMergeColumn: { group: 'layout', summary: '지정 컬럼의 연속된 동일 값을 병합하는 기준입니다.' },
  BGridSummaryItemRenderProps: { group: 'layout', summary: '요약 셀 렌더러에 전달되는 컬럼과 전체 데이터입니다.' },
  BGridSummaryColumn: { group: 'layout', summary: '요약 행의 대상 컬럼, 병합 범위 및 렌더러를 정의합니다.' },
  BGridScrollbarVariant: { group: 'layout', summary: '스크롤바 표현 방식을 선택합니다.' },
  BGridStatusContext: { group: 'layout', summary: '상태 표시줄 콘텐츠 함수에 전달되는 데이터 개수 정보입니다.' },
  BGridStatusContent: { group: 'layout', summary: '상태 표시줄에 표시할 React 노드 또는 렌더 함수입니다.' },
  BGridViewStyleProps: { group: 'layout', summary: '하위 표시 영역에 className과 인라인 style을 전달합니다.' },
  BGridStatusOptions: { group: 'layout', summary: '상태 표시줄의 표시 여부, 콘텐츠 및 스타일을 설정합니다.' },
  BGridPaginationViewOptions: { group: 'layout', summary: '페이지네이션 표시 여부와 스타일을 설정합니다.' },
  BGridHorizontalScrollbarOptions: {
    group: 'layout',
    summary: 'Bottom Bar에 고정된 가로 스크롤바의 표시 여부와 스타일을 설정합니다.',
  },
  BGridVerticalScrollbarOptions: { group: 'layout', summary: '세로 스크롤바의 표시 및 스타일을 설정합니다.' },
  BGridScrollbarOptions: { group: 'layout', summary: '가로·세로 스크롤바 동작과 스타일 변형을 함께 설정합니다.' },
  BGridReorderInfo: { group: 'reorder', summary: '행 드래그 순서 변경의 활성화, 핸들 및 완료 콜백을 정의합니다.' },
  BGridReorderingInfo: { group: 'reorder', summary: '현재 드래그 중인 행의 출발 및 도착 인덱스입니다.' },
  BGridPivotField: { group: 'pivot', summary: '피벗 행·컬럼 축에서 사용할 필드를 정의합니다.' },
  BGridPivotAggregateParams: { group: 'pivot', summary: '사용자 정의 피벗 집계 함수에 전달되는 값과 원본 행입니다.' },
  BGridPivotAggregate: { group: 'pivot', summary: '기본 집계 방식 또는 사용자 정의 집계 함수입니다.' },
  BGridPivotValue: { group: 'pivot', summary: '피벗 값 영역의 집계와 셀 표시 방식을 정의합니다.' },
  BGridPivotValueContext: { group: 'pivot', summary: '피벗 결과 셀의 원본 데이터 및 축 컨텍스트입니다.' },
  BGridPivotValueItemRenderProps: { group: 'pivot', summary: '피벗 값 셀 렌더러에 전달되는 전체 컨텍스트입니다.' },
  BGridPivotValueClipboardTextParams: {
    group: 'pivot',
    summary: '피벗 값 셀을 복사할 때 전달되는 전체 컨텍스트입니다.',
  },
  BGridPivotOptions: { group: 'pivot', summary: '피벗의 행 축, 컬럼 축, 값 및 빈 값 표시를 설정합니다.' },
};

const memberDescriptions: Record<string, string> = {
  width: '그리드 또는 해당 항목의 너비입니다.',
  height: '그리드의 전체 높이입니다.',
  headerHeight: '컬럼 헤더 영역 높이입니다.',
  footerHeight: '더 이상 권장되지 않습니다. bottomBarHeight를 사용하세요.',
  bottomBarHeight: '상태 및 페이지네이션이 배치되는 하단 바 높이입니다.',
  summaryHeight: '요약 행 높이입니다.',
  itemHeight: '데이터 행의 기준 높이입니다.',
  itemPadding: '행 높이를 계산할 때 적용하는 내부 여백입니다.',
  frozenColumnIndex: '이 인덱스 앞의 컬럼을 왼쪽에 고정합니다.',
  frozenRowCount: '현재 표시 데이터의 앞쪽 행을 상단에 고정합니다. 상단 Summary가 있으면 그 다음 줄부터 배치됩니다.',
  columns: '그리드에 표시할 컬럼 정의 배열입니다.',
  columnsGroup: '더 이상 권장되지 않는 인덱스 범위 방식의 그룹 헤더 배열입니다.',
  columnGroups: '컬럼 ID를 참조하는 재귀적 다단 그룹 헤더 트리입니다.',
  data: 'BGridDataItem으로 감싼 행 데이터 배열입니다.',
  onChangeColumns: '컬럼 너비 또는 순서가 바뀔 때 호출됩니다.',
  onChangeData: '편집으로 행 데이터가 바뀔 때 source index와 선택적 트랜잭션 metadata를 전달합니다.',
  page: '페이지 상태와 변경 콜백입니다.',
  enableLoadMore: '스크롤 끝에서 추가 데이터 로드를 활성화합니다.',
  onLoadMore: '추가 데이터를 요청해야 할 때 호출됩니다.',
  endLoadMoreRender: '추가 로드가 끝난 위치에 표시할 콘텐츠입니다.',
  scrollbar: '가로·세로 스크롤바의 표시와 변형을 설정합니다.',
  status: '행 변경 상태 또는 표시 상태 설정입니다.',
  pagination: '하단 페이지네이션 UI를 설정합니다.',
  loading: '데이터 로딩 오버레이를 표시합니다.',
  spinning: '로딩 표시의 회전 상태를 제어합니다.',
  scrollTop: '외부에서 지정하는 세로 스크롤 위치입니다.',
  scrollLeft: '외부에서 지정하는 가로 스크롤 위치입니다.',
  rowChecked: '체크박스 또는 라디오 행 선택을 설정합니다.',
  sort: '제어형 컬럼 정렬 상태를 설정합니다.',
  onClick: '해당 셀 또는 아이콘의 클릭 상호작용이 발생할 때 호출됩니다.',
  msg: '빈 데이터 등 그리드 메시지를 바꿉니다.',
  rowKey: '행의 고유 키를 읽을 필드 경로입니다.',
  selectedRowKey: '선택 강조할 행의 키입니다.',
  editable: '그리드 편집 기능을 활성화합니다.',
  editTrigger: '셀 편집 진입을 클릭 또는 더블클릭으로 선택합니다. 기본값은 dblclick입니다.',
  showLineNumber: '왼쪽에 행 번호 컬럼을 표시합니다.',
  getRowClassName: '행 상태에 따라 CSS 클래스 이름을 반환합니다.',
  cellMergeOptions: '연속된 동일 값 셀의 병합 기준을 설정합니다.',
  cellSelectionOptions: '셀 범위 선택과 표 형태 복사·붙여넣기 제한을 설정합니다.',
  cellNavigationOptions: '활성 셀과 키보드 이동·편집·클릭 활성화 정책을 설정합니다.',
  activeCell: '외부에서 제어하는 현재 활성 셀 주소입니다.',
  defaultActiveCell: '비제어 모드의 초기 활성 셀 주소입니다.',
  onActiveCellChange: '활성 셀 이동을 요청하거나 내부 활성 셀이 바뀔 때 호출됩니다.',
  wrap: '경계에서 반대쪽 셀로 순환할지 설정합니다.',
  editOnEnter: 'Enter 키로 활성 셀의 편집을 시작할지 설정합니다. 비활성화하면 onClick 콜백을 실행합니다.',
  rowIndex: '데이터 배열 기준의 절대 행 인덱스입니다.',
  columnIndex: '컬럼 배열 기준의 절대 컬럼 인덱스입니다.',
  extendSelection: '이동한 셀까지 현재 선택 범위를 확장합니다.',
  toBoundary: '인접 셀 대신 현재 방향의 경계로 이동합니다.',
  selectionEnabled: '이동과 함께 셀 선택 상태를 갱신할지 설정합니다.',
  variant: '그리드 테두리 표현 변형을 선택합니다.',
  summary: '상단 또는 하단 요약 행을 설정합니다.',
  columnSortable: '컬럼 드래그 순서 변경을 활성화합니다.',
  reorder: '행 드래그 순서 변경을 설정합니다.',
  reorderingInfo: '외부에서 현재 행 드래그 위치를 전달합니다.',
  pivot: '피벗 데이터 변환과 표시를 설정합니다.',
  dataControl: '정렬·필터 쿼리의 처리 방식을 제어합니다.',
  icons: '컬럼 툴박스 아이콘을 교체합니다.',
  searchOptions: '현재 로드된 표시 데이터에서 셀을 찾아 하이라이트하고 이전·다음 결과를 이동합니다.',
  contextMenuOptions: '본문 셀의 우클릭 및 키보드 컨텍스트 메뉴에 사용자 항목을 추가합니다.',
  key: '행 값에서 읽을 필드 이름 또는 중첩 경로입니다.',
  label: '화면에 표시할 제목입니다.',
  align: '본문 셀 콘텐츠의 가로 정렬입니다.',
  headerAlign: '헤더 콘텐츠의 가로 정렬입니다.',
  sortDisable: '해당 컬럼의 정렬을 비활성화합니다.',
  className: '요소에 추가할 CSS 클래스 이름입니다.',
  style: '요소에 추가할 React 인라인 스타일입니다.',
  getClassName: '데이터에 따라 CSS 클래스 이름을 반환합니다.',
  headerClassName: '헤더 셀에 추가할 CSS 클래스 이름입니다.',
  headerStyle: '헤더 셀에 적용할 React 인라인 스타일입니다.',
  itemRender: '셀 콘텐츠를 렌더링하는 React 컴포넌트입니다.',
  getClipboardText: '클립보드에 복사할 값을 반환합니다.',
  searchable: '해당 컬럼을 Grid 검색 대상에 포함할지 설정합니다.',
  getSearchText: '렌더링된 DOM 대신 검색에 사용할 동기 문자열 값을 반환합니다.',
  editor: '내장 text 또는 plugin 셀 편집기를 연결합니다.',
  editorIcon: '셀 값 옆에 editor 시작 또는 독립 callback 아이콘을 연결합니다.',
  onChangeValue: 'editor가 제안한 변경을 검증·보정한 뒤 commit 또는 cancel하는 컬럼 hook입니다.',
  startOnInput: '문자 입력으로 text 편집을 바로 시작할지 설정합니다.',
  commitOnBlur: 'text 편집기에서 포커스가 나갈 때 값을 저장할지 설정합니다.',
  formatValue: '셀 값을 text input 문자열로 변환합니다.',
  parseValue: '입력 문자열을 저장할 셀 값으로 변환합니다.',
  ariaLabel: '편집 input 또는 아이콘의 접근 가능한 이름입니다.',
  inputProps: '내장 text input에 전달할 안전한 HTML 속성입니다.',
  component: '편집 상태에서 렌더링할 plugin component입니다.',
  sessionId: '현재 편집 세션의 고유 번호입니다.',
  commit: '한 개 이상의 컬럼 변경 목록을 원자적으로 저장하고 편집을 종료합니다.',
  cancel: '값을 저장하지 않고 편집을 종료합니다.',
  move: '편집 세션에서 활성 셀 이동을 요청합니다.',
  getPortalContainer: 'plugin popup을 연결할 Grid 전용 floating portal 컨테이너를 반환합니다.',
  originalValue: '편집 시작 시점의 원래 셀 값입니다.',
  cell: '편집 또는 이동 대상 셀 주소입니다.',
  toolbox: '컬럼 툴박스의 사용 여부 또는 상세 설정입니다.',
  filter: '컬럼 필터의 사용 여부 또는 상세 설정입니다.',
  sortComparator: '클라이언트 정렬에 사용할 비교 함수입니다.',
  values: '원본 행 값 또는 집계 대상 값입니다.',
  nextValues: '제안된 변경을 immutable하게 미리 적용한 행 값입니다.',
  changes: 'key 또는 columnId로 식별한 컬럼 변경 목록입니다.',
  source: '편집 요청을 시작한 입력 경로입니다.',
  visibility: '아이콘을 항상, hover 또는 활성 셀에서 표시할지 선택합니다.',
  render: '셀 문맥으로 편집 아이콘 React 노드를 렌더링합니다.',
  value: '현재 셀 또는 필터의 값입니다.',
  checked: '행의 체크 여부입니다.',
  meta: '사용자가 행과 함께 보관할 추가 메타데이터입니다.',
  currentPage: '현재 페이지 번호입니다.',
  pageSize: '페이지 또는 PageUp/PageDown 이동 단위의 행 수입니다.',
  totalPages: '전체 페이지 수입니다.',
  totalElements: '전체 데이터 행 수입니다.',
  onChange: '상태가 변경될 때 호출됩니다.',
  checkedIndexes: '선택한 행의 현재 표시 인덱스 배열입니다.',
  checkedRowKeys: '선택한 행의 rowKey 값 배열입니다.',
  disabled: '해당 항목의 상호작용 비활성 여부입니다.',
  orderBy: '오름차순 또는 내림차순 방향입니다.',
  sortParams: '현재 적용된 정렬 조건 배열입니다.',
  filterParams: '현재 적용된 필터 조건 배열입니다.',
  query: '현재 정렬 및 필터 쿼리입니다.',
  mode: '쿼리를 수동 처리할지 클라이언트에서 처리할지 선택합니다.',
  multiSort: '여러 컬럼 동시 정렬을 허용합니다.',
  type: '판별 가능한 설정 또는 이벤트 종류입니다.',
  operator: '필터 비교 연산자입니다.',
  visible: '해당 UI 영역의 표시 여부입니다.',
  position: '해당 UI 영역의 배치 위치입니다.',
  content: '표시할 콘텐츠 또는 렌더 함수입니다.',
  enabled: '기능 활성화 여부입니다.',
  shortcut: 'Grid에 포커스가 있을 때 Ctrl/Cmd+F 검색 진입을 사용할지 설정합니다.',
  contextMenu: '기본 컨텍스트 메뉴에 검색 항목을 포함할지 설정합니다.',
  open: '검색 UI의 제어형 열림 상태입니다.',
  defaultOpen: '비제어 검색 UI의 최초 열림 상태입니다.',
  onOpenChange: '검색 또는 컨텍스트 메뉴의 열림 상태 변경을 알립니다.',
  defaultQuery: '비제어 검색 입력의 최초 검색어입니다.',
  onQueryChange: '사용자가 검색어 변경을 요청할 때 호출됩니다.',
  items: '대상 셀 문맥으로 컨텍스트 메뉴 항목을 만듭니다.',
  formatResultCount: '현재 결과, 전체 결과와 로드된 행 수를 표시할 React 노드를 만듭니다.',
  rows: '해당 컨텍스트의 행 목록 또는 피벗 행 축 필드 배열입니다.',
  aggregate: '피벗 집계 방식 또는 사용자 집계 함수입니다.',
};

const typesPathCandidates = [
  path.resolve(process.cwd(), '../beautiful-grid/types.ts'),
  path.resolve(process.cwd(), 'beautiful-grid/types.ts'),
];
const typesPath = typesPathCandidates.find(candidate => fs.existsSync(candidate));
if (!typesPath) throw new Error('Unable to locate beautiful-grid/types.ts');
const sourceText = fs.readFileSync(typesPath, 'utf8');
const sourceFile = ts.createSourceFile(typesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

function isExported(node: ts.Node) {
  return Boolean(
    ts.canHaveModifiers(node) && ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword),
  );
}

function memberName(member: ts.TypeElement | ts.EnumMember) {
  return member.name?.getText(sourceFile).replace(/^['"]|['"]$/g, '') || '';
}

function getMembers(node: ts.InterfaceDeclaration | ts.EnumDeclaration): ApiReferenceMember[] {
  return node.members.map(member => {
    const name = memberName(member);
    if (ts.isEnumMember(member)) {
      return {
        name,
        type: member.initializer?.getText(sourceFile) || 'number',
        required: true,
        deprecated: false,
        description: memberDescriptions[name] || '열거형 값입니다.',
      };
    }
    const deprecated = /@deprecated/.test(member.getFullText(sourceFile));
    let type = 'unknown';
    if (ts.isPropertySignature(member)) type = member.type?.getText(sourceFile) || 'unknown';
    else if (ts.isMethodSignature(member)) type = member.getText(sourceFile).replace(/^[^(]+/, '');
    return {
      name,
      type,
      required: !member.questionToken,
      deprecated,
      description: memberDescriptions[name] || '타입 시그니처와 연결된 인터페이스를 기준으로 값을 설정합니다.',
    };
  });
}

function declarationHeader(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration | ts.EnumDeclaration) {
  if (ts.isTypeAliasDeclaration(node)) return node.getText(sourceFile);
  const parameters = ts.isInterfaceDeclaration(node)
    ? node.typeParameters?.map((parameter: ts.TypeParameterDeclaration) => parameter.getText(sourceFile)).join(', ')
    : undefined;
  const heritage =
    ts.isInterfaceDeclaration(node) && node.heritageClauses?.length
      ? ` ${node.heritageClauses.map(clause => clause.getText(sourceFile)).join(' ')}`
      : '';
  return `export ${ts.isEnumDeclaration(node) ? 'enum' : 'interface'} ${node.name.text}${
    parameters ? `<${parameters}>` : ''
  }${heritage}`;
}

const entries = sourceFile.statements.flatMap<ApiReferenceEntry>(node => {
  if (
    !isExported(node) ||
    (!ts.isInterfaceDeclaration(node) && !ts.isTypeAliasDeclaration(node) && !ts.isEnumDeclaration(node))
  )
    return [];
  const metadata = typeMetadata[node.name.text];
  if (!metadata) return [];
  return [
    {
      name: node.name.text,
      kind: ts.isInterfaceDeclaration(node) ? 'interface' : ts.isEnumDeclaration(node) ? 'enum' : 'type',
      group: metadata.group,
      summary: metadata.summary,
      declaration: declarationHeader(node),
      members: ts.isInterfaceDeclaration(node) || ts.isEnumDeclaration(node) ? getMembers(node) : [],
      sourceLine: sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1,
    },
  ];
});

const priority = ['BGridProps', 'BGridColumn', 'BGridDataItem'];
export const apiReferenceGroups: ApiReferenceGroup[] = groupDefinitions
  .map(group => ({
    ...group,
    entries: entries
      .filter(entry => entry.group === group.id)
      .sort((a, b) => {
        const ai = priority.indexOf(a.name);
        const bi = priority.indexOf(b.name);
        if (ai !== -1 || bi !== -1) return ai === -1 ? 1 : bi === -1 ? -1 : ai - bi;
        return a.name.localeCompare(b.name);
      }),
  }))
  .filter(group => group.entries.length > 0);

export const apiReferenceEntries = apiReferenceGroups.flatMap(group => group.entries);
export const apiTypeId = (name: string) => name.toLowerCase();
export const apiMemberId = (typeName: string, name: string) =>
  typeName === 'BGridProps' ? name.toLowerCase() : `${apiTypeId(typeName)}-${name.toLowerCase()}`;
