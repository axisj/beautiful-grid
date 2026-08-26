import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import { toMoney } from '../utils/number';

interface Props {}

function Pagination(props: Props) {
  // [Selector Group 1] Pagination State - 페이지네이션 상태
  const { page, displayPaginationLength } = useAppStore(
    useShallow(s => ({
      page: s.page,
      displayPaginationLength: s.displayPaginationLength,
    }))
  );

  // [Selector Group 2] Pagination Actions - 페이지네이션 액션
  const { setPage } = useAppStore(
    useShallow(s => ({
      setPage: s.setPage,
    }))
  );

  const onClickPageNo = React.useCallback(
    (pageNo: number) => {
      if (page) {
        setPage({ ...page, currentPage: pageNo });
        page?.onChange?.(pageNo, page?.pageSize);
      }
    },
    [page, setPage],
  );

  if (page && page.totalPages !== undefined && page.currentPage !== undefined && page.totalPages > 0) {
    const displayLength = Math.min(displayPaginationLength ?? 0, page.totalPages ?? 5);
    const pageStartNumber = (() => {
      const pageEndNumber = Math.min(page.currentPage + Math.floor(displayLength / 2), page.totalPages);
      return Math.max(pageEndNumber - (displayLength - 1), 1);
    })();

    let pageNumber: number = 0;

    return (
      <div className={'bgrid-pagination'}>
        {pageStartNumber > 1 && (
          <>
            <span role={'page-number'} className={'bgrid-page-no'} onClick={() => onClickPageNo(1)}>
              1
            </span>
            {pageStartNumber > 2 && '...'}
          </>
        )}
        {Array.from({ length: displayLength }).map((_, i) => {
          if (i <= (page.totalPages ?? 1)) {
            const num = (pageNumber = pageStartNumber + i);
            return (
              <span
                role={'page-number'}
                key={num}
                className={'bgrid-page-no'}
                data-active={page.currentPage === num}
                onClick={() => onClickPageNo(num)}
              >
                {toMoney(num)}
              </span>
            );
          }
        })}
        {page.totalPages && pageNumber < page.totalPages && (
          <>
            {pageNumber < page.totalPages - 1 && '...'}
            <span role={'page-number'} className={'bgrid-page-no'} onClick={() => onClickPageNo(page.totalPages ?? 0)}>
              {toMoney(page.totalPages)}
            </span>
          </>
        )}
      </div>
    );
  }
  return null;
}
export default Pagination;
