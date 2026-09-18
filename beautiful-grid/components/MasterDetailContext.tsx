import * as React from 'react';
import type {
  BGridDataItem,
  BGridMasterDetailIcons,
  BGridMasterDetailOptions,
  BGridMasterDetailRenderProps,
} from '../types';

export interface BGridMasterDetailContextValue {
  gridId: string;
  expandColumnId: string;
  icons?: BGridMasterDetailIcons;
  expandAriaLabel: string;
  collapseAriaLabel: string;
  disabled: boolean;
  expandedKeysSet: ReadonlySet<React.Key>;
  getRowKey: (values: unknown) => React.Key | undefined;
  hasDetail: (item: BGridDataItem<any>, sourceIndex: number) => boolean;
  detailRender: BGridMasterDetailOptions<any>['detailRender'];
  toggle: (rowKey: React.Key, item: BGridDataItem<any>, sourceIndex: number) => void;
  collapse: (rowKey: React.Key) => void;
  getToggleElementId: (rowKey: React.Key) => string;
  getDetailElementId: (rowKey: React.Key) => string;
}

export const MasterDetailContext = React.createContext<BGridMasterDetailContextValue | undefined>(undefined);

export function useMasterDetailContext() {
  return React.useContext(MasterDetailContext);
}
