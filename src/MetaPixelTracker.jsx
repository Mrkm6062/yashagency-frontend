import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const PIXEL_ID = '1096888672324564'; // Your Meta Pixel ID

const MetaPixelTracker = ({ user }) => {
  const location = useLocation();

  useEffect(() => {
    // Delay loading to prioritize main content
    const timer = setTimeout(() => {
      if (window.fbq) return;
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');

      const userData = user ? {
        em: user.email,
        ph: user.phone,
      } : {};
      window.fbq('init', PIXEL_ID, userData);
      window.fbq('track', 'PageView');
    }, 3000); // Delay by 3 seconds

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [location, user]);

  return null;
};

export default MetaPixelTracker;