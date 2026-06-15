import React from 'react'
import FaceExpression from './features/expression/components/FaceExpression'
import Ref from './features/expression/components/Ref'
import { RouterProvider } from 'react-router'
import { router } from '../src/auth.route'
const App = () => {
  return (
    <>
  <RouterProvider router={router}>
        <FaceExpression/>
  </RouterProvider>
    </>
  )
}

export default App
