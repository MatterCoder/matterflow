import React from 'react'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react';
import {  Badge,  Button, Card,  Table,  TableBody,  TableCell,  TableHead,  TableHeaderCell,  TableRow,} from '@tremor/react';
import { timeTag, truncate } from '../lib/formatters'
import * as API from '../API';
import DialogConfirmation from './DialogConfirmation';

const useFetch = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  
    useEffect(() => {
      const fetchData = async () => {
        try {
          const response = await API.getFlows();
          console.log(response.data)
          setData(response.data);
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


const Flows = () => {

    const { data, loading, error } = useFetch();

    const handleDelete = async (flow_id) => {
        const response = await API.deleteFlow(flow_id);
        window.location.reload();
    }

    const handleActivate = async (flow) => {
      //console.log(flow);
      const response = await API.addProcess(flow);
      //window.location.assign("/processes")
    }
  
    if (loading) {
      return <div>Loading...</div>;
    }
  
    if (error) {
      return <div>Error: {error.message}</div>;
    }

    if (!data) {
      return <div>No data.</div>;
    }

    if (Object.keys(data).length === 0) {
        return (
            <div>There are no flow entries. <Link to={`/flows/edit`} className="rw-button rw-button-small">Create one now?</Link></div>
        );
    }

    return (

  <Table className="w-full">
      <TableHead>          
          <TableRow>            
              <TableHeaderCell>Id</TableHeaderCell>            
              <TableHeaderCell>Name</TableHeaderCell>            
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>        
      </TableHead>        
      <TableBody>          
          {data.map((item) => (            
          <TableRow key={item.id}>
              <TableCell>{item.id}</TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell>
                <div class="flex flex-row">
                  <div class="px-1"><Link to={`/flows/edit/${item.id}`} className="rw-button rw-button-small"><Button className="mx-auto block" >Edit</Button></Link></div>
                  <div class="px-1"><DialogConfirmation id={item} mainMessage={'Activate'} subMessage={'This will start the flow process!'} confirmationHandler={handleActivate} /></div>
                  <div class="px-1"><DialogConfirmation id={item.id} mainMessage={'Delete'} subMessage={'This action cannot be undone!'} confirmationHandler={handleDelete} /></div>
                </div>
              </TableCell>
          </TableRow>          
          ))}
          <TableRow>
            <TableCell>
              <Link to={`/flows/edit`} className="rw-button rw-button-small"><Button className="mx-auto block" >Create Flow</Button></Link>
            </TableCell>
          </TableRow>        
      </TableBody>      
  </Table>


      )
}

export default Flows