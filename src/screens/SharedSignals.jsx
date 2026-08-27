import { Navigate } from 'react-router-dom'

// Shared Journey / Layer 2 is disabled globally pending redesign and review.
export default function SharedSignals() {
  return <Navigate to="/home" replace />
}
