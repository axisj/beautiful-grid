import * as React from 'react';

interface Props {
  direction: 'up' | 'down' | 'left' | 'right';
  variant: 'classic' | 'modern';
  disabled?: boolean;
  onClick: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

const directionLabels = {
  up: '위로 스크롤',
  down: '아래로 스크롤',
  left: '왼쪽으로 스크롤',
  right: '오른쪽으로 스크롤',
};

export function ScrollbarButton({ direction, variant, disabled = false, onClick }: Props) {
  const getIcon = () => {
    switch (direction) {
      case 'up':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 2 L1.5 6.5 L8.5 6.5 Z" fill="currentColor" />
          </svg>
        );
      case 'down':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M5 8 L1.5 3.5 L8.5 3.5 Z" fill="currentColor" />
          </svg>
        );
      case 'left':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5 L6.5 1.5 L6.5 8.5 Z" fill="currentColor" />
          </svg>
        );
      case 'right':
        return (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M8 5 L3.5 1.5 L3.5 8.5 Z" fill="currentColor" />
          </svg>
        );
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (disabled) return;
    onClick(direction);
  };

  return (
    <div
      role="button"
      aria-label={directionLabels[direction]}
      aria-disabled={disabled}
      className={`bgrid-scrollbar-button bgrid-scrollbar-button-${variant} bgrid-scrollbar-button-${direction}`}
      onPointerDown={handlePointerDown}
    >
      {getIcon()}
    </div>
  );
}
