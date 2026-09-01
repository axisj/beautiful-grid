import * as React from 'react';
import {
  clipCellSelectionFragment,
  type BGridSelectionFragment,
  type BGridSelectionQuadrant,
} from '../../utils/cellSelectionGeometry';

interface SelectionViewport {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Props {
  quadrant: BGridSelectionQuadrant;
  selectionFragments: readonly BGridSelectionFragment[];
  activeFragments: readonly BGridSelectionFragment[];
  activeFill: boolean;
  activeRing: boolean;
  viewport: SelectionViewport;
  offsetTop?: number;
}

export function CellSelectionOverlayLayer({
  quadrant,
  selectionFragments,
  activeFragments,
  activeFill,
  activeRing,
  viewport,
  offsetTop = 0,
}: Props) {
  const quadrantSelectionFragments = getVisibleFragments(selectionFragments, quadrant, viewport);
  const quadrantActiveFragments = getVisibleFragments(activeFragments, quadrant, viewport);

  if (quadrantSelectionFragments.length === 0 && quadrantActiveFragments.length === 0) return null;

  return (
    <div className='bgrid-cell-selection-overlay-layer' data-bgrid-selection-quadrant={quadrant} aria-hidden='true'>
      {quadrantSelectionFragments.map(fragment => (
        <div
          key={`selection-${fragment.rangeIndex}`}
          className='bgrid-cell-selection-fragment'
          data-bgrid-selection-fragment='true'
          data-bgrid-selection-range-index={fragment.rangeIndex}
          data-edge-top={fragment.edges.top ? 'true' : undefined}
          data-edge-right={fragment.edges.right ? 'true' : undefined}
          data-edge-bottom={fragment.edges.bottom ? 'true' : undefined}
          data-edge-left={fragment.edges.left ? 'true' : undefined}
          style={getFragmentStyle(fragment, offsetTop)}
        />
      ))}
      {(activeFill || activeRing) &&
        quadrantActiveFragments.map(fragment => (
          <div
            key={`active-${fragment.rangeIndex}`}
            className='bgrid-cell-active-fragment'
            data-bgrid-active-fragment='true'
            data-active-fill={activeFill ? 'true' : undefined}
            data-active-ring={activeRing ? 'true' : undefined}
            style={getFragmentStyle(fragment, offsetTop)}
          />
        ))}
    </div>
  );
}

function getVisibleFragments(
  fragments: readonly BGridSelectionFragment[],
  quadrant: BGridSelectionQuadrant,
  viewport: SelectionViewport,
) {
  return fragments.flatMap(fragment => {
    if (fragment.quadrant !== quadrant) return [];
    const visibleFragment = clipCellSelectionFragment(fragment, viewport);
    return visibleFragment ? [visibleFragment] : [];
  });
}

function getFragmentStyle(fragment: BGridSelectionFragment, offsetTop: number): React.CSSProperties {
  return {
    left: fragment.left,
    top: fragment.top - offsetTop,
    width: fragment.width,
    height: fragment.height,
  };
}
