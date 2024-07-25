import React from 'react'
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
            console.log(response.data)
            console.log(typeof(response.data))

            var data = {}
            if(typeof response.data === 'string') {
                //if the returned data is a string lets try to parse to json
                //before setting the data
                data = JSON.parse(response.data);
            }
            else {
                data = response.data;
            }

            // Transformed array
            const transformedData = data.map(item => {
                return {
                    value: item.json_data,
                    label: item.name
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
    /*
    const data = [
        {      value: "[{'fieldName': 'Test1', 'fieldDatatype': 'Object', 'fieldNameError': ''}]",      label: "Model1",    },    
        {      value: "[{'fieldName': 'Test2', 'fieldDatatype': 'Object', 'fieldNameError': ''}]",      label: "Model2",    },    
        {      value: "[{'fieldName': 'Test3', 'fieldDatatype': 'Object', 'fieldNameError': ''}]",      label: "Model3",    },   
        {      value: "[{'fieldName': 'Test4', 'fieldDatatype': 'Object', 'fieldNameError': ''}]",      label: "Model4",    },    
        {      value: "[{'fieldName': 'Test5', 'fieldDatatype': 'Object', 'fieldNameError': ''}]",      label: "Model5",    },  
    ]
    */
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
