import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { ApiStateProvider } from './context/ApiStateContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApiStateProvider>
        <App />
      </ApiStateProvider>
    </BrowserRouter>
  </React.StrictMode>
)
