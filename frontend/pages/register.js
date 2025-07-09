import { useState } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { Brain, Eye, EyeOff, ArrowLeft, CheckCircle, Shield, Zap, Users, Clock } from 'lucide-react'

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
  
  const { register } = useAuth()
  const router = useRouter()

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
      await register(formData.username, formData.email, formData.password)
      setSuccess('Account succesvol aangemaakt! U wordt doorgestuurd naar het dashboard.')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error) {
      setError('Er is een fout opgetreden bij het aanmaken van uw account. Probeer het opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const benefits = [
    {
      icon: Shield,
      title: "Veilige opslag",
      description: "Uw documenten worden veilig en versleuteld opgeslagen"
    },
    {
      icon: Zap,
      title: "Snelle analyse",
      description: "AI-ondersteunde documentanalyse in seconden"
    },
    {
      icon: Users,
      title: "Samenwerken",
      description: "Deel documenten en inzichten met uw team"
    },
    {
      icon: Clock,
      title: "24/7 beschikbaar",
      description: "Toegang tot uw documenten wanneer u maar wilt"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex flex-col justify-center">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center text-green-700 hover:text-green-800 transition-colors">
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Terug naar home</span>
            </Link>
            <div className="flex items-center">
              <Brain className="h-10 w-10 text-green-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">RAG op Maat</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center py-12">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Maak uw account aan
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Start vandaag nog met slimme documentanalyse en ontdek de kracht van AI-ondersteunde inzichten
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Registration Form */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-12 md:p-16 flex flex-col justify-center">
              <div className="mb-12">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Persoonlijke gegevens
                </h3>
                <p className="text-gray-600 text-lg">
                  Vul uw gegevens in om te beginnen
                </p>
              </div>
              <form className="space-y-8" onSubmit={handleSubmit}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl flex items-center text-base">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl flex items-center text-base">
                    <CheckCircle className="h-6 w-6 mr-3 text-green-600" />
                    {success}
                  </div>
                )}
                <div className="space-y-3">
                  <label htmlFor="username" className="block text-lg font-semibold text-gray-700">
                    Gebruikersnaam
                  </label>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white text-lg"
                    placeholder="Uw gebruikersnaam"
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="email" className="block text-lg font-semibold text-gray-700">
                    E-mailadres
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white text-lg"
                    placeholder="uw@email.nl"
                  />
                </div>
                <div className="space-y-3">
                  <label htmlFor="password" className="block text-lg font-semibold text-gray-700">
                    Wachtwoord
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full p-5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white text-lg"
                      placeholder="Minimaal 6 karakters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <label htmlFor="confirmPassword" className="block text-lg font-semibold text-gray-700">
                    Bevestig wachtwoord
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full p-5 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 bg-gray-50 hover:bg-white text-lg"
                      placeholder="Herhaal uw wachtwoord"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-6 w-6" />
                      ) : (
                        <Eye className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-start space-x-4 p-6 bg-gray-50 rounded-xl">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    required
                    className="h-6 w-6 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="terms" className="text-lg text-gray-700 leading-relaxed">
                    Ik ga akkoord met de{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-medium underline">
                      voorwaarden
                    </a>{' '}
                    en{' '}
                    <a href="#" className="text-green-600 hover:text-green-700 font-medium underline">
                      privacybeleid
                    </a>
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-5 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-xl"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Account aanmaken...
                    </div>
                  ) : (
                    'Account aanmaken'
                  )}
                </button>
              </form>
              <div className="mt-10 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-gray-600 mb-4 text-base">Heeft u al een account?</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full bg-white border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 text-lg"
                  >
                    Inloggen
                  </Link>
                </div>
              </div>
            </div>
            {/* Benefits */}
            <div className="space-y-12 flex flex-col justify-center">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-12 md:p-16">
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-bold text-gray-900 mb-3">
                    Wat krijgt u?
                  </h3>
                  <p className="text-gray-600 text-lg">
                    Ontdek de voordelen van RAG op Maat
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-5 p-6 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                      <div className="flex-shrink-0">
                        <benefit.icon className="h-8 w-8 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2 text-xl">
                          {benefit.title}
                        </h4>
                        <p className="text-lg text-gray-600">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-12 text-white">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12" />
                  </div>
                  <h4 className="text-3xl font-bold mb-3">
                    🎉 Gratis account
                  </h4>
                  <p className="text-green-100 mb-6 text-xl">
                    Start vandaag nog zonder kosten. U kunt altijd upgraden naar een premium account.
                  </p>
                  <div className="flex justify-center space-x-8 text-lg mb-8">
                    <div className="text-center">
                      <div className="font-bold text-xl">✓</div>
                      <div className="text-green-100">Gratis</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-xl">✓</div>
                      <div className="text-green-100">Direct starten</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-xl">✓</div>
                      <div className="text-green-100">Geen verplichting</div>
                    </div>
                  </div>
                  <Link
                    href="/pricing"
                    className="inline-block bg-white text-green-600 hover:bg-green-50 font-semibold py-3 px-6 rounded-lg transition-colors text-base"
                  >
                    Bekijk alle abonnementen
                  </Link>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12">
                <h4 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Vertrouwd door professionals
                </h4>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-green-600">100%</div>
                    <div className="text-lg text-gray-600">Veilig</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">24/7</div>
                    <div className="text-lg text-gray-600">Beschikbaar</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-600">NL</div>
                    <div className="text-lg text-gray-600">Nederlands</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 