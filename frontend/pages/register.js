import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Brain, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const { register, isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Wacht tot de authenticatie is geladen
    if (authLoading) return
    
    // Als gebruiker al is ingelogd, redirect naar dashboard of admin
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isAdmin, authLoading, router])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    if (formData.password !== formData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen')
      setLoading(false)
      return
    }
    if (formData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters lang zijn')
      setLoading(false)
      return
    }
    try {
      const result = await register(formData.username, formData.email, formData.password)
      if (result.success) {
        setSuccess('Account succesvol aangemaakt! U wordt doorgestuurd naar de login pagina.')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Er is een fout opgetreden bij het aanmaken van uw account. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center text-green-700 hover:text-green-800 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" />
            Terug naar home
          </Link>
        </div>
        <div className="flex justify-center mt-6">
          <div className="flex items-center">
            <Brain className="h-12 w-12 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">RAG op Maat</h1>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">Maak uw account aan</h2>
        <p className="mt-2 text-center text-sm text-gray-600">Start vandaag nog met slimme documentanalyse</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded flex items-center text-base">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded flex items-center text-base">
                <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                {success}
              </div>
            )}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Gebruikersnaam</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Uw gebruikersnaam"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mailadres</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="uw@email.nl"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Wachtwoord</label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Minimaal 6 karakters"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Bevestig wachtwoord</label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 pr-12 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Herhaal wachtwoord"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Account aanmaken...
                  </div>
                ) : (
                  'Account aanmaken'
                )}
              </button>
            </div>
          </form>
          <div className="mt-6 text-center">
            <span className="text-gray-600">Al een account? </span>
            <Link href="/login" className="text-green-700 hover:underline">Inloggen</Link>
          </div>
        </div>
      </div>
    </div>
  )
} 