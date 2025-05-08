import './index.css'
import { BrowserRouter , Routes , Route, Navigate } from 'react-router-dom'
import EnhancedPotholeReporter from './pages/Capture'
import PotholeMapDashboard from './pages/PotholeMapDashboard'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        
        <Route path='/admin' element={<PotholeMapDashboard />}/>
        <Route path='/' element={<EnhancedPotholeReporter />}/>
        

      </Routes>
    </BrowserRouter>
  )
}

export default App
