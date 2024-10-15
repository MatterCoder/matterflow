import { useParams } from 'react-router-dom';

const UrlParamsTest = () => {
    const {name} = useParams();
    console.log(name);
  
    return (
      <div>
        <h1>name: {name}</h1>
      </div>
    );
}

export default UrlParamsTest