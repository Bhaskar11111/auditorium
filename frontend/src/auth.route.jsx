import { createBrowserRouter } from "react-router";
import Login from "./auth/pages/Login";
import Register from "./auth/pages/Register";
import Protected from "./auth/components/Protected";
import AirWriting from "./features/expression/components/AirWriting";

export const router=createBrowserRouter([
    {
        path:'/',
        element:<Protected><AirWriting/></Protected>
    },
    {
        path:'/login',
        element:<Login/>
    },
    {
        path:'/register',
        element:<Register/>
    },
])