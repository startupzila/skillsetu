'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

/**
 * LogoutToast — detects the ?logged_out=1 query param on the home page
 * and shows a friendly farewell toast that auto-dismisses in ~4 seconds
 * (the Toaster component handles the auto-dismiss timing).
 *
 * Mounted once on the home page (server component) inside a <Suspense>
 * boundary (required for useSearchParams).
 */
export function LogoutToast() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    if (searchParams.get('logged_out') === '1') {
      toast({
        title: 'Logged out successfully',
        description: 'हम आपके वापस आने का इंतज़ार करेंगे। जल्द से जल्द लौटें और सीखना जारी रखें! 🚀',
      })
      // Clean the URL (remove the query param) without a re-render
      if (window.history.replaceState) {
        const url = window.location.pathname
        window.history.replaceState(null, '', url)
      }
    }
    // Run once on mount — query param is read from the URL
  }, [searchParams, toast])

  return null
}
