import React, { useState } from 'react'
import logo from './../../assets/logo.png'
import { auth } from '../../assets/firebase.js';
import Swal from 'sweetalert2'
import { signInWithEmailAndPassword } from 'firebase/auth'

export default function Login() {

  const [correo, setCorreo] = useState("")
  const [contraseña, setContraseña] = useState("")

  const handleSubmit=async(e)=>{ 
    e.preventDefault();
    console.log(correo)
    console.log(contraseña)
    try {

      await signInWithEmailAndPassword(auth,correo,contraseña)

      Swal.fire({
        title: "Bienvenido al sistema",
        icon: "success",
        draggable: true
      });  
      window.location.href='/Dashboard'

    } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Correo o Contraseña incorrecto"
        });
    }
  }

  return (
    <main className='bg-gradient-to-tr from-purple-950 to-purple-700 h-lvh flex justify-center items-center'>
      <section className='bg-white py-8 w-4/12 px-10 rounded-xl shadow-xl'>
        <div className='flex justify-center mb-8'>
          <img src={logo} className='h-36' />
        </div>

        <h1>Correo:</h1>
        <input type="text" name="" id="" className='mb-5 border border-purple-950 w-full rounded-md p-1 '  onChange={(e)=>setCorreo(e.target.value)} value={correo}/>

        <h1>Contraseña:</h1>
        <input type="password" name="" id="" className='mb-12 border border-purple-950 w-full rounded-md p-1'  onChange={(e)=>setContraseña(e.target.value)} value={contraseña}/>

        <div>
          <button className='bg-gradient-to-tr from-purple-950 to-purple-700 hover:from-purple-700 hover:to-purple-950 w-full mb-8 p-2 text-white rounded-lg' onClick={handleSubmit}>Ingresar</button>
        </div>

      </section>     


    </main>
  )
}
