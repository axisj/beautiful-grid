import * as React from 'react';

export function useContainerSize(ref: React.MutableRefObject<HTMLElement | null>, additionalDeps: unknown[] = []) {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  const resizeObserver = React.useRef(
    new ResizeObserver(entries => {
      if (entries.length !== 1) {
        throw new Error('Invalid Container length');
      }

      const [entry] = entries;

      const { width, height } = entry.contentRect;

      setWidth(width);
      setHeight(height);
    }),
  );

  React.useEffect(() => {
    if (!ref.current) return;

    const observer = resizeObserver.current;
    const element = ref.current;

    setWidth(element.clientWidth);
    setHeight(element.clientHeight);
    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...additionalDeps, ref]);

  return {
    width,
    height,
  };
}
