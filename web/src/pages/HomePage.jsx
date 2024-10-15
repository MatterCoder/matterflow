import Workspace from '../Components/Workspace'
import { Container } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import { useParams } from "react-router-dom";

function HomePage() {
  return (
    <main className='flex'>
          <Container fluid={true} className="App ">
            <Workspace params={useParams()}/>
          </Container>
    </main>
  )
}

export default HomePage
