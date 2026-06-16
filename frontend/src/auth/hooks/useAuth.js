import React from 'react'
import { useContext } from 'react'
import { AuthContext } from '../../auth.context'
import { login,register,getUser,logout } from '../services/auth.api'
import { useEffect } from 'react'
login

export const useAuth = () => {
  const context=useContext(AuthContext)
  const{user,setUser,loading,setLoading}=context

  const handleRegister=(async(username,email,password)=>
  {
    setLoading(true)
    const data=await register({username,email,password})
    setUser(data.user)
    setLoading(false)
  })

  
  const handleLogin=(async(identifier,password)=>
    {
      setLoading(true)
      const data=await login({identifier,password})
      setUser(data.user)
      setLoading(false)
    })

    const handleGetUser=(async()=>
    {
      setLoading(true)
      const data=await getUser()
      setUser(data.user)
      setLoading(false)
    })

    const handleLogout=(async()=>
    {
      setLoading(true)
      const data=await logout()
      setUser(data.user)
      setLoading(false)
    })
    
    useEffect(()=>
    {
      handleGetUser()
    },[])

    return({loading,user,handleRegister,handleLogin,handleGetUser,handleLogout})
  }

export default useAuth