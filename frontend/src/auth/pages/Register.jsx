import React from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import { useState } from "react";

const Register = () => {

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
            }
            await handleRegister(username,email,password)
        navigate('/')
    })

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm">

        <div className="mb-12">
          <h1 className="text-white text-2xl font-regular tracking-wide">
            auditorium
          </h1>
          <p className="text-zinc-500 text-sm mt-2 font-regular">
            Create your account and get started.
          </p>
        </div>

        <form onSubmit={(e)=>handleSubmit(e)} className="space-y-5">
          <div>
            <input
              value={username}
              onChange={(e)=>setUsername(e.target.value)}
              type="text"
              placeholder="Username"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="Email"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e)=>setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-8 bg-white text-black py-3 rounded-full font-normal hover:opacity-90 transition duration-300"
          >
            Create Account
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-zinc-600 text-sm font-regular">
            Already have an account?{" "}
           <Link to='/login'>
            <span className="text-zinc-300 hover:text-white cursor-pointer transition">
              Sign in
            </span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;