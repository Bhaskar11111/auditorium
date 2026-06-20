import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import { useState } from "react";
import { WinampButton, WinampInput, WinampWindow } from "../components/WinampUI";

const Register = () => {

    useEffect(() => {
      document.title = "auditorium - register";
    }, []);

    const{loading,handleRegister}=useAuth()
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const navigate=useNavigate()

    const handleSubmit=(async(e)=>
    {
        e.preventDefault()
        if(password!=confirmPassword)
            {
                alert('Password does not match')
                return
            }
        try {
            await handleRegister(username,email,password)
            navigate('/',{replace:true})
        } catch (error) {
            alert(error.response?.data?.message || 'Registration failed')
        }
    })

  return (
    <WinampWindow mode="REGISTER">
        <form onSubmit={(e)=>handleSubmit(e)} className="space-y-4">
            <WinampInput
              label="Username"
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              type="text"
              placeholder="operator_01"
              autoComplete="username"
            />

            <WinampInput
              label="Email"
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="signal@auditorium.local"
              autoComplete="email"
            />

            <WinampInput
              label="Password"
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="access code"
              autoComplete="new-password"
            />

            <WinampInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              placeholder="repeat access code"
              autoComplete="new-password"
            />

          <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <WinampButton
            type="submit"
            disabled={loading}
          >
            {loading ? 'CREATING...' : 'CREATE ACCOUNT'}
          </WinampButton>
          <WinampButton as={Link} className="grid place-items-center text-center" to="/login">
            BACK TO LOGIN
          </WinampButton>
          </div>
        </form>
    </WinampWindow>
  );
};

export default Register;
