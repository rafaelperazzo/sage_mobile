import { useState, useEffect, useCallback } from 'react'
import { fetchAdminRoles } from '../lib/supabase'
import { useAuthContext } from '../contexts/AuthContext'

interface UseModulePermissionReturn {
  hasAccess: boolean
  loading: boolean
}

export function useModulePermission(moduleName: string): UseModulePermissionReturn {
  const { user } = useAuthContext()
  const [hasAccess, setHasAccess] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!user) {
      setHasAccess(false)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const modules = await fetchAdminRoles(user.id)
      setHasAccess(modules.includes('all') || modules.includes(moduleName))
    } catch (err) {
      console.error(err)
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }, [user, moduleName])

  useEffect(() => {
    void load()
  }, [load])

  return { hasAccess, loading }
}
