export function ResourceHints() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  
  return (
    <>
      {/* Preconnect to critical third-party domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* DNS prefetch for API calls and analytics */}
      {appUrl && <link rel="dns-prefetch" href={appUrl} />}
      
      {/* Prefetch critical routes - these are the most commonly accessed */}
      <link rel="prefetch" href="/directory" as="document" />
      <link rel="prefetch" href="/courses" as="document" />
      <link rel="prefetch" href="/people" as="document" />
      <link rel="prefetch" href="/semesters" as="document" />
      <link rel="prefetch" href="/professors" as="document" />
      
      {/* Preload critical fonts */}
      {/* <link 
        rel="preload" 
        href="/fonts/inter-var.woff2" 
        as="font" 
        type="font/woff2" 
        crossOrigin="anonymous" 
      /> */}
      
      {/* Progressive enhancement meta tags */}
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      
      {/* Service worker registration hint */}
      <link rel="serviceworker" href="/sw.js" />
    </>
  );
}