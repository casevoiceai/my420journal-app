import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import WhoTookMyLighter from './features/games/who-took-my-lighter/WhoTookMyLighter'

const directGamePath = window.location.pathname.replace(/\/+$/, '')
const RootExperience = directGamePath === '/games/who-took-my-lighter'
  ? WhoTookMyLighter
  : App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootExperience />
  </StrictMode>
)
