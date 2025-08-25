import React, { useEffect, useState } from 'react'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowRightFromBracket, faFileArrowUp,faIdCard, faXmark} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import axios from 'axios';
import { auth } from '../../assets/firebase';

export default function Dashboard() {

  const [aviso,setAviso]=useState([]);
  const [correo, setCorreo] = useState("")
  
  const fetchUserData=()=>{
  auth.onAuthStateChanged ((user)=>{
    console.log(user)
    setCorreo(user)
    console.log(correo)
  })
}
  useEffect(()=>{
    axios.get('https://backend-bridge-production.up.railway.app/ConsultarAvisos')
    .then(res=>setAviso(res.data))
    .catch(err=>console.log(err))
    console.log(aviso)
    fetchUserData()
    
  },[])


  const handleDelete = async (id_aviso) => {
    try {
      console.log(id_aviso)
      await axios.delete('https://backend-bridge-production.up.railway.app/EliminarAviso/'+id_aviso)
      window.location.reload()
    }catch(err) {
    console.log(err);
    }  
  }

  async function handleLogOut(){
    try {
      
      await auth.signOut();
      window.location.href='/'
    } catch (e) {
      
    }
  }  


  return (
    <main>
        <Navbar titulo="Instituto Tecnologico Bridge"/>

        <div className='flex justify-end'>
             <button className='text-white mr-7 py-2 px-4 bg-red-700 rounded-lg' onClick={handleLogOut}><FontAwesomeIcon icon={faArrowRightFromBracket} /></button>
        </div>

        <h1 className='font-semibold ml-2 mt-1 text-2xl'>Bienvenido {correo.email} Que desea realizar?</h1>
        
        {/* BOTONES ACCION */}
        <section className='flex justify-evenly mt-16'>

            {/* SUBIR CALIFICACIONES*/}
            <Link to="/SubirCalificaciones" className='bg-purple-900 p-10 text-8xl text-white rounded-2xl hover:bg-purple-950  flex flex-col'><FontAwesomeIcon icon={faFileArrowUp} /> <h1 className='text-sm text-white mt-7 font-extralight text-center'>Subir Calificaciones</h1></Link>

            {/* CONSULTAR GRUPOS*/}
            <Link to="/ConsultarGrupos" className='bg-purple-900 p-10 text-8xl text-white rounded-2xl hover:bg-purple-950 flex flex-col'><FontAwesomeIcon icon={faIdCard} /> <h1 className='text-sm text-white mt-7 font-extralight text-center'>Consultar Grupos</h1></Link>

        </section>

        {/* AVISOS */}
        <section className='flex justify-center mt-28'>
            <div className='border-purple-500 border-2 w-4/5'>
                <h1 className='bg-purple-100 text-center'>Avisos</h1>

                {/* RENDERIZADO DE AVISOS */}
                <div className='flex m-2'>
                  
                {
                    aviso.map((data,i)=>(
                      <div key={i} className='border-2 m-2'>
                        <div className='flex justify-between items-center ml-1'>
                            <h1 className='text-xs font-bold'>{data.titulo} </h1>          
                            {/* <button onClick={e=>handleDelete(data.id_aviso)} className='bg-red-700 px-1 text-white m-1 hover:bg-red-950 rounded-md flex justify-center items-center'>
                              <FontAwesomeIcon icon={faXmark} />
                            </button> */}
                        </div>
                          <p className='text-xs mt-2'>{data.descripcion}</p>          
                      </div>          
                ))
                }            
                </div>
            </div>
        </section>


    

    </main>
  )
}
