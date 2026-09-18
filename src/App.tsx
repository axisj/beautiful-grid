import * as React from 'react';
import BodyRoot from '../components/BodyRoot';
import { Spinner } from '../components/Spinner';
import { Container } from '../components/Layouts';

const BasicExample = React.lazy(() => import('../examples/BasicExample'));
const CellMergeExample = React.lazy(() => import('../examples/CellMergeExample'));
const CellNavigationExample = React.lazy(() => import('../examples/CellNavigationExample'));
const CheckedExample = React.lazy(() => import('../examples/CheckedExample'));
const ColumnsGroupExample = React.lazy(() => import('../examples/ColumnsGroupExample'));
const ColumnSortExample = React.lazy(() => import('../examples/ColumnSortExample'));
const DisabledExample = React.lazy(() => import('../examples/DisabledExample'));
const EditorExample = React.lazy(() => import('../examples/EditorExample'));
const FocusExample = React.lazy(() => import('../examples/FocusExample'));
const FrozenColumnsExample = React.lazy(() => import('../examples/FrozenColumnsExample'));
const GetRowClassName = React.lazy(() => import('../examples/GetRowClassName'));
const LineNumberExample = React.lazy(() => import('../examples/LineNumberExample'));
const LoadingExample = React.lazy(() => import('../examples/LoadingExample'));
const PagingExample = React.lazy(() => import('../examples/PagingExample'));
const PivotExample = React.lazy(() => import('../examples/PivotExample'));
const ReorderExample = React.lazy(() => import('../examples/ReorderExample'));
const SortExample = React.lazy(() => import('../examples/SortExample'));
const ScrollExample = React.lazy(() => import('../examples/ScrollExample'));
const VariableRowHeightExample = React.lazy(() => import('../examples/VariableRowHeightExample'));
const SummaryExample = React.lazy(() => import('../examples/SummaryExample'));
const ToolboxExample = React.lazy(() => import('../examples/ToolboxExample'));
const ScrollbarExample = React.lazy(() => import('../examples/ScrollbarExample'));
const SearchExample = React.lazy(() => import('../examples/SearchExample'));
const ContextMenuExample = React.lazy(() => import('../examples/ContextMenuExample'));
const ColumnVisibilityExample = React.lazy(() => import('../examples/ColumnVisibilityExample'));
const TreeFoldingExample = React.lazy(() => import('../examples/TreeFoldingExample'));
const ExportExample = React.lazy(() => import('../examples/ExportExample'));
const MasterDetailExample = React.lazy(() => import('../examples/MasterDetailExample'));

interface DemoPageProps {
  title: string;
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function DemoPage({ title, children, currentPath, onNavigate }: DemoPageProps) {
  return (
    <BodyRoot>
      <Container currentPath={currentPath} onNavigate={onNavigate}>
        <div>
          <h2>{title}</h2>
          {children}
        </div>
      </Container>
    </BodyRoot>
  );
}

const DEMO_ROUTES: Record<string, { title: string; component: React.LazyExoticComponent<React.ComponentType> }> = {
  '/': { title: 'Basic', component: BasicExample },
  '/toolbox': { title: 'Header Toolbox (Sort & Filter)', component: ToolboxExample },
  '/column-visibility': { title: 'Column Visibility', component: ColumnVisibilityExample },
  '/lineNumber': { title: 'LineNumber', component: LineNumberExample },
  '/columnGroup': { title: 'ColumnsGroup', component: ColumnsGroupExample },
  '/sort': { title: 'Sort', component: SortExample },
  '/radioBox': { title: 'Radio Checkbox', component: CheckedExample },
  '/paging': { title: 'Paging', component: PagingExample },
  '/pivot': { title: 'Pivot', component: PivotExample },
  '/loading': { title: 'Loading', component: LoadingExample },
  '/disabled': { title: 'Disabled', component: DisabledExample },
  '/focus': { title: 'Focus', component: FocusExample },
  '/frozenColumns': { title: 'Frozen Columns', component: FrozenColumnsExample },
  '/editor': { title: 'Editor', component: EditorExample },
  '/cellNavigation': { title: 'Cell Navigation', component: CellNavigationExample },
  '/virtualScroll': { title: 'VirtualScroll', component: ScrollExample },
  '/variableRowHeight': { title: 'Variable Row Height', component: VariableRowHeightExample },
  '/getRowClassName': { title: 'GetRowClassName', component: GetRowClassName },
  '/cellMerge': { title: 'CellMerge', component: CellMergeExample },
  '/summary': { title: 'Summary', component: SummaryExample },
  '/columnSort': { title: 'Column Sort', component: ColumnSortExample },
  '/reorder': { title: 'Reorder data', component: ReorderExample },
  '/scrollbar': { title: 'Scrollbar', component: ScrollbarExample },
  '/search': { title: 'Grid Search & Context Menu', component: SearchExample },
  '/contextMenu': { title: 'Cell Context Menu', component: ContextMenuExample },
  '/treeFolding': { title: 'Tree Folding', component: TreeFoldingExample },
  '/export': { title: 'Data Export (CSV & JSON)', component: ExportExample },
  '/masterDetail': { title: 'Master-Detail (Nested Grid)', component: MasterDetailExample },
};

function App() {
  const [pathname, setPathname] = React.useState(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname || '/';
  });

  React.useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || '/');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleNavigate = React.useCallback((path: string) => {
    if (window.location.pathname === path) return;
    window.history.pushState({}, '', path);
    setPathname(path);
  }, []);

  const currentRoute = DEMO_ROUTES[pathname] ?? DEMO_ROUTES['/'];
  const CurrentComponent = currentRoute.component;

  React.useEffect(() => {
    if (!DEMO_ROUTES[pathname]) {
      window.history.replaceState({}, '', '/');
      setPathname('/');
    }
  }, [pathname]);

  return (
    <DemoPage title={currentRoute.title} currentPath={pathname} onNavigate={handleNavigate}>
      <React.Suspense
        fallback={
          <RouteLoading>
            <Spinner />
          </RouteLoading>
        }
      >
        <CurrentComponent />
      </React.Suspense>
    </DemoPage>
  );
}

function RouteLoading({ children }: { children: React.ReactNode }) {
  return <div className={'flex min-h-[120px] items-center justify-center'}>{children}</div>;
}

export default App;
