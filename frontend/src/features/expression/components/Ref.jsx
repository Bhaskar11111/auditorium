import React, { useRef } from 'react'

const Ref = () => {
    const inputRef=useRef(null)
    const inputHandler=(()=>
    {
        console.log(inputRef)
        inputRef.current.focus()
        inputRef.current.style.color="red"
    })

  return (
<>
<input ref={inputRef} type="text" placeholder='Enter name' />
<button onClick={()=>inputHandler()}>Input Handle</button>
</>
  )
}

export default Ref
