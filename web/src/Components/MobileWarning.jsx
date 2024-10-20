import { useEffect, useState } from 'react';

const MobileWarning = () => {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    // Function to check if device is mobile or tablet
    const checkDevice = () => {
      const screenWidth = window.innerWidth;

      // User agent check for tablets or mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const isTabletOrMobile = /android|ipad|iphone|ipod/.test(userAgent) || screenWidth < 1024;

      setIsMobileOrTablet(isTabletOrMobile);
    };

    // Check on initial load
    checkDevice();

    // Recheck on window resize
    window.addEventListener('resize', checkDevice);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  if (isMobileOrTablet) {
    return (
      <div style={{ textAlign: 'center', marginTop: '20%' }}>
        <h1>App is not supported on mobile or tablet devices</h1>
        <p>Please use a desktop or larger screen to access this application.</p>
      </div>
    );
  }

  // Return null or nothing if the screen size is acceptable
  return null;
};

export default MobileWarning;
