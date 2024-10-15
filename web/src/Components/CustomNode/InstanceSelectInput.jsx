import { useState, useEffect } from 'react';
import * as API from '../../API';

const InstanceSelectInput = ( props ) => {
  const [value, setValue] = useState(props.value);
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState('');

  const {keyName, onChange} = props;

  // Fetch instances from the API when the component mounts
  useEffect(() => {
    const fetchInstances = async () => {
      try {
        const response = await API.getInstances();
        setInstances(response.data);  // Assuming response.data is an array of instances
      } catch (error) {
        console.error('Failed to fetch instances:', error);
      }
    };

    fetchInstances();

    //set the current select
    if (props.value) {
      setSelectedInstance(props.value.id);
    }
  }, [props.value]);

    // whenever value changes, fire callback to update config form
    useEffect(() => {
      onChange(keyName, value);
  },
  [value, keyName, onChange]);

  // Handle selection change
  const handleChange = (event) => {
    const selectedId = event.target.value;
    setSelectedInstance(selectedId);

    // Find the selected instance data
    const selectedInstanceData = instances.find(instance => instance.id === parseInt(selectedId));
    if (selectedInstanceData) {
      setValue(selectedInstanceData);
      setSelectedInstance(selectedInstanceData.id);
    }

  };


  return (
    <>
    <select value={selectedInstance} onChange={handleChange}>
      <option value="" disabled>Select an instance</option>
      {instances.map(instance => (
        <option key={instance.id} value={instance.id} >
          {instance.description}
        </option>
      ))}
    </select>
    </>
  );
};

export default InstanceSelectInput;
