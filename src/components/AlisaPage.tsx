import React, { useEffect } from 'react';
import { AlisaLandingPage } from './AlisaLandingPage';

interface AlisaPageProps {
  onNavigateHome?: () => void;
  onNavigateOrder?: (packageId?: string, color?: string) => void;
}

export const AlisaPage: React.FC<AlisaPageProps> = ({ onNavigateHome, onNavigateOrder }) => {
  useEffect(() => {
    document.title = 'Mukena Traveling 2in1 Laser Cut Alisa Premium - saena.my.id';
    try {
      if (window.location.pathname !== '/alisa') {
        window.history.replaceState({}, '', '/alisa');
      }
    } catch {
      // ignore
    }
  }, []);

  return <AlisaLandingPage onNavigateHome={onNavigateHome} onNavigateOrder={onNavigateOrder} />;
};
export default AlisaPage;
