import { useState } from 'react'
import LoginModal from './component/LoginModal'
import Dashboard from './component/Dashboard'
import './App.css'

function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [email, setEmail] = useState('')

  return signedIn
    ? <Dashboard email={email} onLogout={() => setSignedIn(false)} />
    : <LoginModal onLogin={(userEmail) => {
        setEmail(userEmail)
        setSignedIn(true)
      }} />
}

export default App