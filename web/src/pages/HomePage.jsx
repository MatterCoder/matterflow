import Workspace from '../Components/Workspace';
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import { useParams } from 'react-router-dom';
import MobileWarning from '../Components/MobileWarning';
import { useEffect, useState } from 'react';

function HomePage() {
  const params = useParams(); // Call useParams unconditionally

  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);

  useEffect(() => {
    // Function to check if device is mobile or tablet
    const checkDevice = () => {
      const screenWidth = window.innerWidth;

      // User agent check for iPads or other tablets
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

  // If it's a mobile or tablet device, only render the MobileWarning
  if (isMobileOrTablet) {
    return <MobileWarning />;
  }

  // If it's not a mobile or tablet device, render the rest of the app
  return (
    <main className="flex">
      <Container fluid={true} className="App">
        <Workspace params={params} />
      </Container>
    </main>
  );
}

export default HomePage;
