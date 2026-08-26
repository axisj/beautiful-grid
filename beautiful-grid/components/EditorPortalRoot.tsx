import * as React from 'react';

const essentialThemeProperties = [
  '--bgrid-font-family',
  '--bgrid-font-size',
  '--bgrid-primary-color',
  '--bgrid-body-bg',
  '--bgrid-body-color',
];

export function syncEditorPortalTheme(gridRoot: HTMLElement, portalRoot: HTMLElement) {
  if (typeof window === 'undefined') return;

  const computed = window.getComputedStyle(gridRoot);
  const customProperties = new Set(essentialThemeProperties);

  for (let index = 0; index < computed.length; index += 1) {
    const propertyName = computed.item(index);
    if (propertyName.startsWith('--bgrid-')) customProperties.add(propertyName);
  }

  let current: HTMLElement | null = gridRoot;
  while (current) {
    for (let index = 0; index < current.style.length; index += 1) {
      const propertyName = current.style.item(index);
      if (propertyName.startsWith('--bgrid-')) customProperties.add(propertyName);
    }
    current = current.parentElement;
  }

  customProperties.forEach(propertyName => {
    const value = computed.getPropertyValue(propertyName).trim();
    if (value) portalRoot.style.setProperty(propertyName, value);
  });

  portalRoot.style.fontFamily = computed.fontFamily;
  portalRoot.style.fontSize = computed.fontSize;
  portalRoot.style.lineHeight = computed.lineHeight;
  portalRoot.style.color = computed.color;
}

export interface EditorPortalContextValue {
  gridRef: React.RefObject<HTMLDivElement | null>;
  portalRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const EditorPortalContext = React.createContext<EditorPortalContextValue | null>(null);

export function EditorPortalRoot({ gridRef, portalRef }: EditorPortalContextValue) {
  React.useEffect(() => {
    const gridRoot = gridRef.current;
    if (!gridRoot || typeof document === 'undefined') return;

    const portalRoot = document.createElement('div');
    portalRoot.className = 'bgrid-floating-portal-root bgrid-editor-portal-root';
    portalRoot.setAttribute('data-bgrid-floating-portal-root', 'true');
    portalRoot.setAttribute('data-bgrid-editor-portal-root', 'true');
    syncEditorPortalTheme(gridRoot, portalRoot);
    document.body.appendChild(portalRoot);
    portalRef.current = portalRoot;

    return () => {
      portalRef.current = null;
      portalRoot.remove();
    };
  }, [gridRef, portalRef]);

  return null;
}
