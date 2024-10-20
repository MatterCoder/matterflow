import { Link } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'

const routes = [
    {
      path:"/",
      element: <HomePage/>
    },  
    {
      path:"/:flow_id",
      element: <HomePage/>
    },
    {
      path:"/about",
      element: 
        <>
          <div>About Us</div>
          <Link to="/" relative="path">
            Home
          </Link> 
        </>
    }
  ]

export default routes