import * as React from 'react';
import './DataGridContainer.css';

interface DataGridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * Keeps a DataGrid in a measured, fixed layout box.
 *
 * BGrid's rendered root is absolutely positioned within this relative
 * container. This makes a ResizeObserver measurement authoritative when a
 * surrounding flex or grid layout shrinks as well as when it expands.
 */
const DataGridContainer = React.forwardRef<HTMLDivElement, DataGridContainerProps>(
  ({ className, ...rest }, ref) => (
    <div ref={ref} className={`data-grid-container ${className ?? ''}`.trim()} {...rest} />
  ),
);

DataGridContainer.displayName = 'DataGridContainer';

export default DataGridContainer;
