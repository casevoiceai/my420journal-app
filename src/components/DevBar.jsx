import { useEffect } from 'react'
import { migrateExistingLocalProfile } from '../lib/localProfile'

export default function DevBar() {
  useEffect(() => {
    migrateExistingLocalProfile()
  }, [])

  return null
}
