import * as React from 'react';

interface Props {
  active: boolean;
  size?: 'small' | 'normal';
}

function Loading({ active, size = 'normal' }: Props) {
  const [isVisible, setIsVisible] = React.useState(active);

  React.useEffect(() => {
    if (active) {
      setIsVisible(true);
    } else {
      // Delay hiding to allow fade-out animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="bgrid-loading-overlay"
      data-active={active ? 'true' : 'false'}
    >
      <div
        role="rft-spinner-box"
        className="bgrid-loading-spinner-box"
        data-size={size}
      >
        <div role="rft-spinner" className="bgrid-spinner" data-size={size} />
        {size === 'normal' && <div role="rft-spinner-text">Loading</div>}
      </div>
    </div>
  );
}

export default Loading;
