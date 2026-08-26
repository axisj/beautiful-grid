import * as React from 'react';
import type { BGridSelectionFragment, BGridSelectionQuadrant } from '../../utils/cellSelectionGeometry';
import { CellSelectionOverlayLayer } from './CellSelectionOverlayLayer';

interface Props {
  quadrant: BGridSelectionQuadrant;
  selectionFragments: readonly BGridSelectionFragment[];
  activeFragments: readonly BGridSelectionFragment[];
  activeFill: boolean;
  activeRing: boolean;
  viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export function CellSelectionOverlay(props: Props) {
  return <CellSelectionOverlayLayer {...props} />;
}
