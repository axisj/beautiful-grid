import * as React from 'react';

interface ISPinIconProps {
  size?: number;
  strokeWidth?: number;
}

export const Spinner: React.FC<ISPinIconProps> = ({ size = 20, strokeWidth = 5 }) => (
  <svg className='h-5 w-5 animate-spin' viewBox='0 0 50 50' style={{ width: size, height: size }}>
    <circle className='demo-spinner-path' cx='25' cy='25' r='20' fill='none' strokeWidth={strokeWidth} />
  </svg>
);
