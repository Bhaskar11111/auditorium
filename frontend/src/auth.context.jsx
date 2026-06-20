import React from 'react'
import { createContext,useEffect,useState } from 'react'
import { getUser } from './auth/services/auth.api'

export const AuthContext=createContext()
export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      const loadUser = async () => {
        try {
          const data = await getUser()
          setUser(data.user || false)
        } catch {
          setUser(false)
        } finally {
          setLoading(false)
        }
      }

      loadUser()
    }, [])

  return (
   <AuthContext.Provider value={{user,setUser,loading,setLoading}}>
    {children}
   </AuthContext.Provider>
  )
}
