import React from "react";
import { Link, useNavigate } from "react-router";
import useAuth from "../hooks/useAuth";
import { useState } from "react";

const Login = () => {

    const navigate=useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    
    const {loading,handleLogin}=useAuth()

    const handleSubmit=(async(e)=>
    {
        e.preventDefault()
        await handleLogin(email,password)
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
            Sign in to continue your journey.
          </p>
        </div>

        <form onSubmit={handleSubmit}
        className="space-y-5">
          <div>
            <input
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              type="text"
              placeholder="Email or username"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div>
            <input
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              type="password"
              placeholder="Password"
              className="w-full bg-transparent border-b border-zinc-800 py-3 text-zinc-200 placeholder:text-zinc-600 font-regular outline-none focus:border-white transition-all duration-300"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs text-zinc-500 font-regular">
              <input
                type="checkbox"
                className="accent-white"
              />
              Remember me
            </label>

            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition font-regular"
            >
              Forgot password
            </button>
          </div>

          <button
            type="submit"
            className="w-full mt-8 bg-white text-black py-3 rounded-full font-normal hover:opacity-90 transition duration-300"
          >
            Continue
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-zinc-600 text-sm font-regular">
            New here?{" "}
           <Link to='/register'>
            <span className="text-zinc-300 hover:text-white cursor-pointer transition">
              Create account
            </span>
           </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;