import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import WhoTookMyLighter from './features/games/who-took-my-lighter/WhoTookMyLighter'
import TheNewPlace from './features/games/the-new-place/TheNewPlace'

const directGamePath = window.location.pathname.replace(/\/+$/, '')
const directExperiences = {
  '/games/who-took-my-lighter': WhoTookMyLighter,
  '/games/the-new-place': TheNewPlace,
}
const RootExperience = directExperiences[directGamePath] || App

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RootExperience />
  </StrictMode>
)
