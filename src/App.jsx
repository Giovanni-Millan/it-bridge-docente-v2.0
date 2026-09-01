import { useState } from 'react'
import './App.css'
import {BrowserRouter as Router , Routes,Route} from 'react-router-dom'
import Dashboard from './pages/Dashboard/Dashboard'
import SubirCalificaciones from './pages/SubirCalificaciones/SubirCalificaciones'
import ConsultarGrupos from './pages/ConsultarGrupos/ConsultarGrupos'
import Login from './pages/Login/Login'
import Semestre1M from './pages/Grupos/Semestre1'
import Semestre2M from './pages/Grupos/Semestre2'
import Semestre3M from './pages/Grupos/Semestre3'
import Semestre4M from './pages/Grupos/Semestre4'
import Semestre5M from './pages/Grupos/Semestre5'
import Semestre6M from './pages/Grupos/Semestre6'
import ListarCalificaciones from './pages/ConsultarGrupos/ListarCalificaciones'
import ModificarCalificacion from './pages/ConsultarGrupos/ModificarCalificacion'
import Semestre1 from './pages/GrupoConsultado/Semestre1'
import Semestre2 from './pages/GrupoConsultado/Semestre2'
import Semestre3 from './pages/GrupoConsultado/Semestre3'
import Semestre4 from './pages/GrupoConsultado/Semestre4'
import Semestre5 from './pages/GrupoConsultado/Semestre5'
import Semestre6 from './pages/GrupoConsultado/Semestre6'
import SubirCalificacionesAlumno from './pages/SubirCalificaciones/SubirCalificacionesAlumno'
import MiGrupo from './pages/MiGrupo/MiGrupo'
import CalificarBachillerato from './pages/Calificar/CalificarBachillerato'
import CalificarUniversidad from './pages/Calificar/CalificarUniversidad'
import TomarAsistencia from './pages/Asistencia/TomarAsistencia'
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton'


function App() {


  return (
    <Router>
      <Routes>
        <Route path='/' Component={Login}/>
        <Route path='/Dashboard' Component={Dashboard}/>
        <Route path='/SubirCalificaciones' Component={SubirCalificaciones}/>
        <Route path='/ConsultarGrupos' Component={ConsultarGrupos}/>

        {/* COMPLEMENTO: MIS GRUPOS ASIGNADOS (visible desde el Dashboard) */}
        <Route path='/MiGrupo/:id_grupo' Component={MiGrupo}/>
        <Route path='/Calificar/Bachillerato/:id_grupo' Component={CalificarBachillerato}/>
        <Route path='/Calificar/Universidad/:id_grupo' Component={CalificarUniversidad}/>
        <Route path='/Asistencia/:id_grupo' Component={TomarAsistencia}/>

        {/* SUBIR CALIFICACIONES */}
        <Route path='/GrupoSemestre1' Component={Semestre1M}/>
        <Route path='/GrupoSemestre2' Component={Semestre2M}/>
        <Route path='/GrupoSemestre3' Component={Semestre3M}/>
        <Route path='/GrupoSemestre4' Component={Semestre4M}/>
        <Route path='/GrupoSemestre5' Component={Semestre5M}/>
        <Route path='/GrupoSemestre6' Component={Semestre6M}/>
        <Route path='/ListarCalisAlumno/:id' Component={ListarCalificaciones}/>
        <Route path='/ModificarCalificacion/:id' Component={ModificarCalificacion}/>
        <Route path='/SubirCalificacionesAlumno/:id' Component={SubirCalificacionesAlumno}/>

        <Route path='/CGrupoSemestre1' Component={Semestre1}/>
        <Route path='/CGrupoSemestre2' Component={Semestre2}/>
        <Route path='/CGrupoSemestre3' Component={Semestre3}/>
        <Route path='/CGrupoSemestre4' Component={Semestre4}/>
        <Route path='/CGrupoSemestre5' Component={Semestre5}/>
        <Route path='/CGrupoSemestre6' Component={Semestre6}/>


      </Routes>

      <WhatsAppFloatingButton />
    </Router>
  )
}

export default App
