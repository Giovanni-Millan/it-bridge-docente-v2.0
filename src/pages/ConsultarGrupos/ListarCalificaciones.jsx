import React, { useEffect, useState } from 'react'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowLeft,faPenToSquare} from '@fortawesome/free-solid-svg-icons';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../../components/Navbar';



export default function ListarCalificaciones() {

    const {id}=useParams();
    const [data,setData]=useState([]);

    useEffect(()=>{
        console.log(id)
        axios.get('https://backend-bridge-production.up.railway.app/ConsultarCalisPorAlumno/'+id)
        .then(res=>setData(res.data))
        .catch(err=>console.log(err))
      console.log(data)  
    },[])


  return (
    <main>
        <Navbar titulo="Calificaciones"/>

         <div className='mt-10'>  
            <Link to="/SubirCalificaciones" className='bg-purple-300 ml-16 p-4 text-purple-950 rounded-md hover:bg-purple-500'><FontAwesomeIcon icon={faArrowLeft} /></Link>
        </div>


        <section>

            <div className='flex justify-center mt-14'>
                <table className='bg-purple-700 text-white text-center border-2 border-purple-300'>
                    <tr className='border-2 bg-purple-900'>
                        <td className='px-7 border-2'>Materia</td>
                        <td className='px-7 border-2'>Parcial 1</td>
                        <td className='px-7 border-2'>Parcial 2</td>
                        <td className='px-7 border-2'>Parcial 3</td>
                        <td className='px-7 border-2'>Promedio</td>
                        <td className='px-7 border-2'></td>
                    </tr>


                {
                    data.map((data,i)=>(
                      <tr key={i} className='bg-purple-400'>
                        <td className='bg-purple-700 border-2 px-6'>{data.nombre_materia} </td>
                        <td className='text-purple-950 font-semibold  border-b-2'>{data.parcial_1} </td>
                        <td className='text-purple-950 font-semibold border-b-2'>{data.parcial_2} </td>
                        <td className='text-purple-950 font-semibold border-b-2'>{data.parcial_3} </td>
                        <td className='text-purple-950 font-semibold border-b-2'>{data.Promedio_Calificaciones} </td>
                        <td className='bg-blue-700 hover:bg-blue-950  font-semibold border-b-2'><Link to={'/ModificarCalificacion/'+data.id_calificacion}><FontAwesomeIcon icon={faPenToSquare} className='text-white' /></Link></td>
                      </tr>   
                  
                    ))
                }

                </table>


                      
            </div>

            <div className='flex justify-center w-full border-2 mt-20'>
              <Link to={'/SubirCalificacionesAlumno/'+id} className='bg-purple-900 py-2 px-14 text-white text-center rounded-md hover:bg-purple-950 hover:cursor-pointer'><FontAwesomeIcon icon={faPenToSquare} className='mr-5' />Registrar Calificaciones</Link>
            </div>

        </section>




    </main>
  )
}
