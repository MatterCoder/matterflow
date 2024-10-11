import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import routes from './router.jsx' //the routes are defined in this file
import './index.css'

//create the react router - routes defined in router.jsx
const router = createBrowserRouter(routes);

const App = () => (
    <RouterProvider router={ router }/>
)

export default App

