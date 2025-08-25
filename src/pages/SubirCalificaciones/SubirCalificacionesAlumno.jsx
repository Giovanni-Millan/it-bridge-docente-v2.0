import React, { useState } from 'react'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import Navbar from '../../components/Navbar';

export default function SubirCalificacionesAlumno() {

    const navigate=useNavigate();
    const {id}=useParams();
    const [id_materia, setId_materia] = useState("");
    const [parcial_1, setParcial_1] = useState("");
    const [parcial_2, setParcial_2] = useState("");
    const [parcial_3, setParcial_3] = useState("");

    const handleSubmit = (event)=> {
        event.preventDefault();
        axios.post('https://backend-bridge-production.up.railway.app/SubirCalificaciones/'+id, {id_materia,parcial_1,parcial_2,parcial_3})
        .then(res => {
        console.log(res);
        navigate('/SubirCalificaciones');
        }).catch(err => console.log(err));
        }


  return (
    <main>

        <Navbar titulo="Subir Calificaciones"/>

        <div className='mt-10'>  
            <Link to="/ConsultarUsuarios" className='bg-purple-300 ml-16 p-4 text-purple-950 rounded-md hover:bg-purple-500'><FontAwesomeIcon icon={faArrowLeft} /></Link>
        </div>

        <div className='flex justify-center  pantalla -mt-5'>
            <div className='flex justify-center  w-2/5 h-1/3'>
                <form action="" className='w-full'>

                    <h1>Id De la materia:</h1>
                    <input type="text" className='border border-gray-500 w-full rounded-md mb-3' onChange={e=>setId_materia(e.target.value)} />

                    <h1>Parcial 1</h1>
                    <input type="text" className='border border-gray-500 w-full rounded-md mb-3' onChange={e=>setParcial_1(e.target.value)} />

                    <h1>Parcial 2:</h1>
                    <input type="text" className='border border-gray-500 w-full rounded-md mb-3' onChange={e=>setParcial_2(e.target.value)} />

                    <h1>Parcial 3:</h1>
                    <input type="text" className='border border-gray-500 w-full rounded-md mb-3' onChange={e=>setParcial_3(e.target.value)} />
                    

                    <div className='flex justify-center mt-3'>
                    {/* <input className='bg-purple-900 py-2 px-24 text-white text-center rounded-md hover:bg-purple-950 hover:cursor-pointer' type='submit' value={"Crear Aviso "} onClick={handleSubmit}></input> */}                    
                        {/* <button className='bg-purple-900 py-2 px-24 text-white rounded-md hover:bg-purple-950 hover:cursor-pointer'>Inscribir Alumno</button> */}
                        <input className='bg-purple-900 py-2 px-24 text-white text-center rounded-md hover:bg-purple-950 hover:cursor-pointer' type='submit' value={"Registrar Calificaciones"} onClick={handleSubmit}></input>
                    </div>
                </form>
            </div>
        </div>




    
    </main>
  )
}
