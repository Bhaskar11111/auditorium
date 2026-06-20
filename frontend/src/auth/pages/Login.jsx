import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import { useState } from "react";
import { WinampButton, WinampInput, WinampWindow } from "../components/WinampUI";

const Login = () => {

  useEffect(() => {
    document.title = "auditorium - login";
  }, []);

    const navigate=useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    
    const {loading,handleLogin}=useAuth()

    const handleSubmit=(async(e)=>
    {
        e.preventDefault()
        try {
          await handleLogin(username,password)
          navigate('/',{replace:true})
        } catch (error) {
          alert(error.response?.data?.message || 'Login failed')
        }
    })

  return (
    <WinampWindow mode="LOGIN">
        <form onSubmit={handleSubmit} className="space-y-4">
            <WinampInput
              label="Username"
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              type="text"
              placeholder="operator_01"
              autoComplete="username"
            />

            <WinampInput
              label="Password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              type="password"
              placeholder="access code"
              autoComplete="current-password"
            />

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <WinampButton
            type="submit"
            disabled={loading}
          >
            {loading ? 'ACCESSING...' : 'LOGIN'}
          </WinampButton>
          <WinampButton as={Link} className="grid place-items-center text-center" to="/register">
              CREATE ACCOUNT
          </WinampButton>
          </div>
      </form>
    </WinampWindow>
  );
};

export default Login;
