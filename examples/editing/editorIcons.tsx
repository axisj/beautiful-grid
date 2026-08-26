import * as React from 'react';

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  focusable: false,
  'aria-hidden': true,
};

export function ChevronDownIcon() {
  return (
    <svg {...iconProps}>
      <path d='m4 6 4 4 4-4' />
    </svg>
  );
}

export function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x='2.5' y='3.5' width='11' height='10' rx='1.5' />
      <path d='M5 2.5v2M11 2.5v2M2.5 6.5h11' />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx='8' cy='8' r='5.5' />
      <path d='M8 4.75V8l2.25 1.5' />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg {...iconProps}>
      <circle cx='7' cy='7' r='3.75' />
      <path d='m10 10 3 3' />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg {...iconProps}>
      <path d='m3 8.25 3 3L13 4.5' />
    </svg>
  );
}
