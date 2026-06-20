import React from 'react'
import { useNavigate } from 'react-router'
import useAuth from '../hooks/useAuth'

const Logout = ({}) => {
  const navigate=useNavigate()
  const {handleLogout,loading}=useAuth()

  const onLogout=async()=>
  {
    try {
      await handleLogout()
    } finally {
      navigate('/login',{replace:true})
    }
  }
  
  return (
    <div>
    <button
      type='button'
      onClick={onLogout}
      disabled={loading}
      className='text-[13px] font-thin tracking-[0.16em] text-white/60 hover:text-white/80 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
    >
      Logout
    </button>

    </div>
  )
}

export default Logout
