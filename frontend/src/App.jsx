import React from 'react'
import Ref from './features/expression/components/Ref'
import { RouterProvider } from 'react-router'
import { router } from '../src/auth.route'
import AirWriting from './features/expression/components/AirWriting'
const App = () => {
  return (
    <>
  <RouterProvider router={router}>
        <AirWriting/>
  </RouterProvider>

    </>
  )
}

export default App
