import React from 'react'
import './navbar.css'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRightFromBracket } from '@fortawesome/free-solid-svg-icons';


import logo from '../assets/logo.png'


export default function Navbar(props) {
  return (
    <nav className='bg-purple-950 flex justify-between items-center gap-3 py-3 px-3 sm:px-0'>
        <div className='flex-shrink-0'>
            <img src={logo} className='logo ml-2 sm:ml-5 bg-white rounded-full p-1' />
        </div>

        <div className='text-white font-thin text-lg sm:text-2xl md:text-3xl text-center truncate'>
            {props.titulo}
        </div>

        <div className='flex-shrink-0 w-8 sm:w-12'>

        </div>
    </nav>
  )
}
