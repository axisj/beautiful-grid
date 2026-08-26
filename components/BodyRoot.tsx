import * as React from 'react';
interface BodyRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const BodyRoot = React.forwardRef<HTMLDivElement, BodyRootProps>(({ className, ...rest }, ref) => {
  return <div ref={ref} className={`p-5 ${className ?? ''}`.trim()} {...rest} />;
});

BodyRoot.displayName = 'BodyRoot';

export default BodyRoot;
