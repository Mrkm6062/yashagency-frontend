import React from 'react';

const BackToTopButton = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <button onClick={scrollToTop} className="fixed bottom-24 lg:bottom-6 right-6 bg-blue-600 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition-all duration-300 z-50">
      ↑
    </button>
  );
};

export default BackToTopButton;