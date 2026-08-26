import React from 'react';
import Nav from './Nav';

interface ContainerProps {
  children?: React.ReactNode;
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Container: React.FC<ContainerProps> = ({ children, currentPath, onNavigate }) => {
  return (
    <div className={'relative'}>
      <Nav currentPath={currentPath} onNavigate={onNavigate} />
      {children}
    </div>
  );
};
