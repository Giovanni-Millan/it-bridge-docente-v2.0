import React from 'react'
import Navbar from '../../components/Navbar'

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faArrowLeft} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

export default function ConsultarGrupos() {
  return (
    <main>
        <Navbar titulo="Consultar Grupos"/>

        <div className='mt-10'>  
          <Link to="/Dashboard" className='bg-purple-300 ml-16 p-4 text-purple-950 rounded-md hover:bg-purple-500'><FontAwesomeIcon icon={faArrowLeft} /></Link>
        </div>

        <section>

        {/* select * from alumnos where semestre=2;

        al hacer click a cada uno de los grupos de semestre enlistar la lista de alumnos de cada semestre correspondiente

        className='text-5xl text-red-700'>solo es lista de alumnos por semestre, (numero de lista / nombre y apellidos) */}
          <div className=' flex justify-evenly mt-14'>

            <Link to='/CGrupoSemestre1' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 1</Link>

            <Link to='/CGrupoSemestre2' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 2</Link>

            <Link to='/CGrupoSemestre3' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 3</Link>

            <Link to='/CGrupoSemestre4' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 4</Link>

            <Link to='/CGrupoSemestre5' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 5</Link>

            <Link to='/CGrupoSemestre6' className='bg-purple-800 p-4 text-white font-bold rounded-md hover:bg-purple-900'>Semestre 6</Link>
          </div>

        </section>


    </main>
  )
}

