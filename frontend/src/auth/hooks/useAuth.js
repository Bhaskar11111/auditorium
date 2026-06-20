import { useContext } from 'react'
import { AuthContext } from '../../auth.context'
import { login,register,logout } from '../services/auth.api'

export const useAuth = () => {
  const context=useContext(AuthContext)
  const{user,setUser,loading,setLoading}=context

  const handleRegister=(async(username,email,password)=>
  {
    setLoading(true)
    try {
      const data=await register({username,email,password})
      setUser(data.user)
      return data
    } finally {
      setLoading(false)
    }
  })

  
  const handleLogin=(async(identifier,password)=>
    {
      setLoading(true)
      try {
        const data=await login({identifier,password})
        setUser(data.user)
        return data
      } finally {
        setLoading(false)
      }
    })

    const handleLogout=(async()=>
    {
      setLoading(true)
      try {
        const data=await logout()
        setUser(false)
        return data
      } catch (error) {
        setUser(false)
        throw error
      } finally {
        setLoading(false)
      }
    })

    return({loading,user,handleRegister,handleLogin,handleLogout})
  }

export default useAuth
