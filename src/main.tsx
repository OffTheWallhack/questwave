import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import App from './App'
import { DEMO } from './lib/supabase'
import './index.css'

// Na podadrese (GitHub Pages /questwave/) server nepozná cesty ako /feed — vtedy cesty idú za #.
const Router = DEMO || import.meta.env.BASE_URL !== '/' ? HashRouter : BrowserRouter

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
)
