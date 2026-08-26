import * as React from 'react';
import { delay, mouseEventSubscribe } from '../utils';
import { useAppStore } from '../store';

interface StyledProps {
  hideHandle?: boolean;
  bordered?: boolean;
  frozenBoundary?: boolean;
}

interface Props extends StyledProps {
  container: React.RefObject<HTMLDivElement | null>;
  columnIndex: number;
}

function ColResizer({ container, columnIndex, hideHandle, bordered, frozenBoundary }: Props) {
  const setColumnWidth = useAppStore(s => s.setColumnWidth);
  const setColumnResizing = useAppStore(s => s.setColumnResizing);
  const columnsGroup = useAppStore(s => s.columnsGroup);

  const onPointerDownResizerHandle = React.useCallback(
    (evt: React.PointerEvent<HTMLDivElement>, columnIndex: number) => {
      evt.preventDefault();
      evt.stopPropagation();

      const columnNode = container.current?.querySelector(
        `.bgrid-head-cell[data-column-index="${columnIndex}"]`,
      );
      const columnSX = columnNode?.getBoundingClientRect().left ?? 0;

      mouseEventSubscribe(
        mousePosition => {
          const mX = mousePosition.clientX + 1;
          const width = columnSX + 50 < mX ? mX - columnSX : 50;
          setColumnResizing(true);
          setColumnWidth(columnIndex, { width, updateColumns: true });
        },
        () => {
          setColumnWidth(columnIndex);
          setColumnResizing(false);
        },
        {
          interval: 0,
          target: evt.currentTarget,
          pointerId: evt.pointerId,
          initialClientX: evt.clientX,
        },
      );
    },
    [container, setColumnResizing, setColumnWidth],
  );

  const onMouseDoubleClick = React.useCallback(
    async (evt: React.MouseEvent<HTMLDivElement, MouseEvent>, columnIndex: number) => {
      evt.preventDefault();
      evt.stopPropagation();

      if (container.current) {
        const headFrozenHTML = container.current.querySelector('[role="rfdg-head-frozen"]')?.innerHTML;
        const headHTML = container.current.querySelector('[role="rfdg-head"]')?.innerHTML;
        const bodyFrozenHTML = container.current.querySelector('[role="rfdg-body-frozen"]')?.innerHTML;
        const bodyHTML = container.current.querySelector('[role="rfdg-body"]')?.innerHTML;
        const targetDiv = document.createElement('div');
        targetDiv.style.position = 'fixed';
        targetDiv.style.top = '-9999px';

        targetDiv.innerHTML = `<table><thead>${headFrozenHTML}</thead><tbody>${bodyFrozenHTML}</tbody></table>
<table><thead>${headHTML}</thead><tbody>${bodyHTML}</tbody></table>`;
        const bodyTarget = document.getElementById('root') ?? document.body;
        bodyTarget.append(targetDiv);

        await delay(30);

        const targetTd = targetDiv.querySelector(
          `tr td.bgrid-head-cell[data-column-index="${columnIndex}"]`,
        );

        if (targetTd) {
          setColumnWidth(columnIndex, { width: targetTd.getBoundingClientRect().width });
          setColumnWidth(columnIndex, { updateColumns: true });
        }
        targetDiv.remove();
      }
    },
    [container, setColumnWidth],
  );

  return (
    <div
      className={[
        'bgrid-col-resizer',
        hideHandle ? '' : 'bgrid-col-resizer-handle',
        frozenBoundary ? 'bgrid-col-resizer-frozen-boundary' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-bgrid-frozen-boundary={frozenBoundary ? 'true' : undefined}
      style={!hideHandle ? { ['--bgrid-resizer-height' as string]: bordered ? '100%' : '1em' } : undefined}
      onPointerDown={(evt: React.PointerEvent<HTMLDivElement>) => onPointerDownResizerHandle(evt, columnIndex)}
      onDoubleClick={(evt: React.MouseEvent<HTMLDivElement>) => onMouseDoubleClick(evt, columnIndex)}
      onClick={(evt: React.MouseEvent<HTMLDivElement>) => evt.stopPropagation()}
    />
  );
}

export default ColResizer;
