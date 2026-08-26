import React from 'react';
import {
  BGridPaginationViewOptions,
  BGridResolvedPaginationViewOptions,
  BGridResolvedScrollbarOptions,
  BGridResolvedStatusOptions,
  BGridScrollbarOptions,
  BGridStatusOptions,
  BGridStatusContent,
  BGridStatusContext,
} from '../types';
import { toMoney } from './number';

export function resolveStatusOptions(
  options?: BGridStatusOptions,
): BGridResolvedStatusOptions {
  return {
    visible: options?.visible ?? true,
    configured: options !== undefined,
    content: options?.content,
    className: options?.className,
    style: options?.style,
  };
}

export function resolvePaginationViewOptions(
  options?: BGridPaginationViewOptions,
): BGridResolvedPaginationViewOptions {
  return {
    visible: options?.visible ?? true,
    className: options?.className,
    style: options?.style,
  };
}

export function resolveScrollbarOptions(
  options: BGridScrollbarOptions | undefined,
): BGridResolvedScrollbarOptions {
  const variant = options?.variant ?? 'modern';

  return {
    variant,
    horizontal: {
      visible: options?.horizontal?.visible ?? true,
      className: options?.horizontal?.className,
      style: options?.horizontal?.style,
    },
    vertical: {
      visible: options?.vertical?.visible ?? true,
      className: options?.vertical?.className,
      style: options?.vertical?.style,
    },
  };
}

export function shouldRenderBottomBar(params: {
  hasPage: boolean;
  hasHorizontalOverflow?: boolean;
  scrollbar: BGridResolvedScrollbarOptions;
  status: BGridResolvedStatusOptions;
  pagination: BGridResolvedPaginationViewOptions;
}): boolean {
  const hasDockedHorizontalScrollbar =
    params.scrollbar.variant !== 'native' &&
    params.scrollbar.horizontal.visible &&
    (params.hasHorizontalOverflow ?? true);

  const hasPageSection =
    params.hasPage &&
    (params.status.visible || params.pagination.visible);

  const hasStatus = params.status.visible;

  return hasPageSection || hasDockedHorizontalScrollbar || hasStatus;
}

export function resolveStatusContent(
  content: BGridStatusContent | undefined,
  context: BGridStatusContext,
): React.ReactNode {
  if (typeof content === 'function') {
    return content(context);
  }
  if (content !== undefined) {
    return content;
  }
  return `${toMoney(context.totalItems)} Items`;
}
