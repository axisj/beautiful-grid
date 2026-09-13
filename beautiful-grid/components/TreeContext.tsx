import * as React from 'react';
import type { BGridTreeIcons, BGridTreeRowMeta } from '../types';

export interface BGridTreeContextValue {
  treeColumnId: string;
  indentSize: number;
  icons?: BGridTreeIcons;
  expandAriaLabel: string;
  collapseAriaLabel: string;
  disabled: boolean;
  metaByRowKey: ReadonlyMap<React.Key, BGridTreeRowMeta>;
  metaBySourceIndex: ReadonlyMap<number, BGridTreeRowMeta>;
  getRowKey: (values: unknown) => React.Key | undefined;
  toggle: (meta: BGridTreeRowMeta) => void;
}

export const TreeContext = React.createContext<BGridTreeContextValue | undefined>(undefined);

export function useTreeContext() {
  return React.useContext(TreeContext);
}
