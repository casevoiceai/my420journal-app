import { useEffect, useRef, useState } from 'react'
import MarketingLayout from './MarketingLayout'
import { marketingFonts, marketingPage, marketingPalette as S } from './marketingStyles'

export function AboutSection({ id = undefined, tone = 'base' }) {
  const [isNoTraceModalOpen, setIsNoTraceModalOpen] = useState(false)
  const noTraceTriggerRef = useRef(null)
  const modalCloseRef = useRef(null)

  useEffect(() => {