import React, { useEffect } from 'react';
import { AlisaLandingPage } from './AlisaLandingPage';

interface AlisaPageProps {
  onNavigateHome?: () => void;
}

export const AlisaPage: React.FC<AlisaPageProps> = ({ onNavigateHome }) => {
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

  return <AlisaLandingPage onNavigateHome={onNavigateHome} />;
};
export default AlisaPage;
