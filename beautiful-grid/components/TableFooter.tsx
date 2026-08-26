import * as React from 'react';
import Pagination from './Pagination';
import { useAppStore } from '../store';
import { resolveStatusContent } from '../utils';
import { useShallow } from 'zustand/react/shallow';
import { CustomScrollbar, BGridAxisMetrics } from './scrollbar';

interface Props {
  horizontalMetrics?: BGridAxisMetrics;
  scrollLeft?: number;
  onScrollLeftChange?: (offset: number) => void;
}

function TableFooter({ horizontalMetrics, scrollLeft, onScrollLeftChange }: Props) {
  const { page, scrollbar, status, pagination, dataLength } = useAppStore(
    useShallow(s => ({
      page: s.page,
      scrollbar: s.scrollbar,
      status: s.status,
      pagination: s.pagination,
      dataLength: s.data.length,
    }))
  );

  const statusContainerRef = React.useRef<HTMLDivElement>(null);
  const pagingContainerRef = React.useRef<HTMLDivElement>(null);

  const totalItems = page ? (page.totalElements ?? 0) : dataLength;

  return (
    <div className={'bgrid-footer-content'}>
      {page && pagination?.visible && (
        <div
          ref={pagingContainerRef}
          role={'paging'}
          className={`bgrid-footer-paging ${pagination.className ?? ''}`}
          style={pagination.style}
        >
          <Pagination />
        </div>
      )}

      {status?.visible && (
        <div
          ref={statusContainerRef}
          role={'status'}
          className={`bgrid-footer-status ${status.className ?? ''}`}
          style={status.style}
        >
          {resolveStatusContent(status.content, { totalItems, visibleItems: dataLength, page })}
        </div>
      )}

      {scrollbar.variant !== 'native' &&
        scrollbar.horizontal.visible &&
        horizontalMetrics &&
        horizontalMetrics.hasOverflow &&
        scrollLeft !== undefined &&
        onScrollLeftChange && (
          <div className="bgrid-horizontal-scrollbar-area bgrid-horizontal-scrollbar-area-bottom">
             <CustomScrollbar
               orientation="horizontal"
               variant={scrollbar.variant}
               metrics={horizontalMetrics}
               scrollOffset={scrollLeft}
               onScrollChange={onScrollLeftChange}
             />
          </div>
        )}
    </div>
  );
}

export default TableFooter;
