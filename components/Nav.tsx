import * as React from 'react';
import { Button, Space, Tabs, Tag } from 'antd';
import pkg from '../package.json';
import { GithubFilled, LinkOutlined } from '@ant-design/icons';

interface Props {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

function Nav({ currentPath, onNavigate }: Props) {
  const activePath = currentPath ?? (typeof window !== 'undefined' ? window.location.pathname : '/');

  const handleNavigate = React.useCallback(
    (path: string) => {
      if (onNavigate) {
        onNavigate(path);
        return;
      }

      if (typeof window !== 'undefined' && window.location.pathname !== path) {
        window.history.pushState({}, '', path);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    },
    [onNavigate],
  );

  return (
    <div className={'demo-nav'}>
      <div className={'mb-2 flex items-center gap-2.5'}>
        <h1 className={'m-0'}>beautiful-grid</h1>
        <div className={'rounded bg-black px-1.5 py-0.5 text-white'}>{pkg.version}</div>

        <GithubFilled
          rev={undefined}
          style={{ fontSize: 20 }}
          onClick={() => window.open('https://github.com/axisj/beautiful-grid')}
        />

        <Button
          type={'link'}
          onClick={() => window.open('https://github.com/axisj/beautiful-grid/tree/master/examples')}
          icon={<LinkOutlined rev={undefined} />}
        >
          Examples
        </Button>
      </div>
      <Tabs
        animated={false}
        activeKey={activePath}
        items={[
          { label: `Basic`, key: '/' },
          {
            label: (
              <Space>
                Header Toolbox<Tag color="blue">v1.12+</Tag>
              </Space>
            ),
            key: '/toolbox',
          },
          { label: `LineNumber`, key: '/lineNumber' },
          { label: `ColumnGroup`, key: '/columnGroup' },
          { label: `Sort`, key: '/sort' },
          { label: `Radio Checkbox`, key: '/radioBox' },
          { label: `Paging`, key: '/paging' },
          {
            label: (
              <Space>
                Pivot<Tag>v1.10+</Tag>
              </Space>
            ),
            key: '/pivot',
          },
          { label: `Loading`, key: '/loading' },
          { label: `Focus`, key: '/focus' },
          { label: `Frozen Columns`, key: '/frozenColumns' },
          { label: `Editor`, key: '/editor' },
          { label: `Cell Navigation`, key: '/cellNavigation' },
          { label: `VirtualScroll`, key: '/virtualScroll' },
          { label: `GetRowClassName`, key: '/getRowClassName' },
          {
            label: (
              <Space>
                CellMerge<Tag>v1.1.9</Tag>
              </Space>
            ),
            key: '/cellMerge',
          },
          {
            label: (
              <Space>
                Summary<Tag>v1.2</Tag>
              </Space>
            ),
            key: '/summary',
          },
          {
            label: (
              <Space>
                ColumnSort<Tag>v1.4+</Tag>
              </Space>
            ),
            key: '/columnSort',
          },
          {
            label: (
              <Space>
                Reorder data<Tag>v1.6+</Tag>
              </Space>
            ),
            key: '/reorder',
          },
          {
            label: (
              <Space>
                Scrollbar<Tag color="blue">v1.12+</Tag>
              </Space>
            ),
            key: '/scrollbar',
          },
          {
            label: (
              <Space>
                Search<Tag color="blue">v1.12+</Tag>
              </Space>
            ),
            key: '/search',
          },
          {
            label: (
              <Space>
                Context Menu<Tag color="blue">v1.12+</Tag>
              </Space>
            ),
            key: '/contextMenu',
          },
        ]}
        onTabClick={activeKey => {
          handleNavigate(activeKey);
        }}
      />
    </div>
  );
}

export default Nav;
