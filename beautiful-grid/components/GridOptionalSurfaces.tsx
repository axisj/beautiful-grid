import * as React from 'react';
import type { RefObject } from 'react';
import { GridContextMenu } from './context-menu/GridContextMenu';
import { GridSearchController } from './search/GridSearchController';
import { GridSearchPopover } from './search/GridSearchPopover';

interface GridOptionalSurfacesProps {
  gridRef: RefObject<HTMLDivElement | null>;
  searchPopoverRef: RefObject<HTMLDivElement | null>;
  searchEnabled: boolean;
  contextMenuEnabled: boolean;
}

export function GridOptionalSurfaces({
  gridRef,
  searchPopoverRef,
  searchEnabled,
  contextMenuEnabled,
}: GridOptionalSurfacesProps) {
  return (
    <>
      {searchEnabled && <GridSearchController />}
      {searchEnabled && <GridSearchPopover ref={searchPopoverRef} gridRef={gridRef} />}
      {contextMenuEnabled && <GridContextMenu gridRef={gridRef} />}
    </>
  );
}
