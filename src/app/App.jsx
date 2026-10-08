import { BrowserRouter } from 'react-router-dom'
import AppRouter from './AppRouter.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'
import { BusinessDataProvider } from '../hooks/BusinessDataProvider.jsx'

function App() {
  return <BrowserRouter><AuthProvider><BusinessDataProvider><AppRouter /></BusinessDataProvider></AuthProvider></BrowserRouter>
}

export default App
