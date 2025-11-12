import React, { useState, useEffect } from "react";
import CookieBanner from "./CookieBanner.jsx";
import MainApp from "./App"; // your main app component

export default function App() {
  const [cookieConsent, setCookieConsent] = useState(null);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent") === "true";
    setCookieConsent(consent);
  }, []);

  if (cookieConsent === null) return null; // wait until loaded

  const handleAccept = () => {
    setCookieConsent(true);
    localStorage.setItem("cookie_consent", "true");
  };

  return (
    <>
      {!cookieConsent && <CookieBanner onAccept={handleAccept} />}
      {cookieConsent && <MainApp />}
    </>
  );
}
