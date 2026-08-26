import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

if (!Element.prototype.scrollTo) {
  Object.defineProperty(Element.prototype, 'scrollTo', {
    writable: true,
    configurable: true,
    value: function scrollTo(arg1: number | ScrollToOptions, arg2?: number) {
      if (typeof arg1 === 'object') {
        if (typeof arg1.top === 'number') {
          (this as Element & { scrollTop?: number }).scrollTop = arg1.top;
        }
        if (typeof arg1.left === 'number') {
          (this as Element & { scrollLeft?: number }).scrollLeft = arg1.left;
        }
        return;
      }

      if (typeof arg1 === 'number') {
        (this as Element & { scrollLeft?: number }).scrollLeft = arg1;
      }
      if (typeof arg2 === 'number') {
        (this as Element & { scrollTop?: number }).scrollTop = arg2;
      }
    },
  });
}

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
