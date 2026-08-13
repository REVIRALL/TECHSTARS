import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { StudioModel } from './components/StudioModel';
import { Process } from './components/Process';
import { Portfolio } from './components/Portfolio';
import { Team } from './components/Team';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';
import { FixedPageOverlay } from './components/FixedPageOverlay';
import { PageType } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>(PageType.None);

  const handleOpenPage = (page: PageType) => {
    setCurrentPage(page);
    // Disable background scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };

  const handleClosePage = () => {
    setCurrentPage(PageType.None);
    document.body.style.overflow = 'auto';
  };

  return (
    <div className="font-sans text-white bg-black selection:bg-brand-500 selection:text-black">
      <Navbar onOpenPage={handleOpenPage} />

      <main>
        <Hero />
        <StudioModel />
        <Portfolio />
        <Process />
        <Team />
        <Contact />
      </main>
      
      <Footer onOpenPage={handleOpenPage} />

      <FixedPageOverlay page={currentPage} onClose={handleClosePage} />
    </div>
  );
};

export default App;