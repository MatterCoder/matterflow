import {  Select,  SelectItem } from '@tremor/react';
import { useState, useEffect } from 'react';
import * as API from '../API';

const useFetch = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
            const response = await API.getModels();

            var data = {}
            if(typeof response.data === 'string') {
                //if the returned data is a string lets try to parse to json
                //before setting the data
                data = JSON.parse(response.data);
            }
            else {
                data = response.data;
            }

            // Filter out empty models
            const filteredEmpty = data.filter(function (el) {
                return el.json_data != "{}";
              });

            // Transformed array
            const transformedData = filteredEmpty.map(item => {
                return {
                    value: item.json_data,
                    label: item.description
                };
            });
            
            setData(transformedData);
        } catch (error) {
            setError(error);
        } finally {
            setLoading(false);
        }
      };
  
      fetchData();
  
      // Cleanup function
      return () => {
        // Cleanup logic, if necessary
      };
    }, []);
  
    return { data, loading, error };
  }

const ModelSelect = (props) => {
    const { data, loading, error } = useFetch();

    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (error) {
      return <div>Error: {error.message}</div>;
    }

    if (!data) {
      return <div>No data.</div>;
    }

    const handleSelectChangeInput = (value) => {
        console.log("handleSelectChangeInput")
        props.onValueChange(value);
    };

    return (   
        <>      
        <label htmlFor="model">Select model</label>
        <Select
            onValueChange={(value) => handleSelectChangeInput(value)}
        >
            {data.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
            ))}
        </Select>
        </>
    )
}

export default ModelSelect
