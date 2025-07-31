import { ReactNode } from 'react';

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export const MainLayout = ({ sidebar, children }: MainLayoutProps) => {
  return (
    <div className="remarkable-width mx-auto bg-white shadow-lg">
      <div className="flex min-h-screen">
        {sidebar}
        <div className="flex-1 p-6">
          <div className="main-content p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
