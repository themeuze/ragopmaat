import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import { Shield, Crown, Star, Check, Clock, Mail, ArrowRight, Home, LogIn, UserPlus } from 'lucide-react'

export default function Pricing() {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => { setLoading(false) }, [])

  const handleUpgrade = (tierName) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (tierName === 'White Label') {
      window.location.href = 'mailto:info@ragopmaat.nl?subject=White Label Aanvraag&body=Ik ben geïnteresseerd in een White Label oplossing voor RAG Op Maat.'
      return
    }
    alert(`Upgrade naar ${tierName} - Betalingsintegratie komt binnenkort!`)
  }

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      router.push('/register')
      return
    }
    alert('Trial wordt gestart! Je krijgt 14 dagen premium functionaliteit.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0">
      {/* Navigatiebalk */}
      <nav className="w-full bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <Shield className="h-7 w-7 text-green-600 mr-2" />
            <span className="font-bold text-lg text-gray-900">RAG op Maat</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push('/')} className="flex items-center text-gray-700 hover:text-green-600 font-medium transition-colors">
              <Home className="h-5 w-5 mr-1" /> Home
            </button>
            <button onClick={() => router.push('/login')} className="flex items-center text-gray-700 hover:text-green-600 font-medium transition-colors">
              <LogIn className="h-5 w-5 mr-1" /> Inloggen
            </button>
            <button onClick={() => router.push('/register')} className="flex items-center text-white bg-green-600 hover:bg-green-700 font-medium px-4 py-2 rounded-lg transition-colors">
              <UserPlus className="h-5 w-5 mr-1" /> Registreren
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 mt-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kies je Abonnement</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Beide abonnementen zijn de eerste 14 dagen volledig gratis met premium functionaliteit. Daarna kun je kiezen om te upgraden of downgraden.
          </p>
        </div>

        {/* Trial Banner */}
        <div className="bg-green-500 text-white rounded-lg p-4 mb-10 text-center font-medium text-lg">
          <Clock className="inline h-6 w-6 mr-2 align-middle" />
          14 Dagen Gratis Trial &mdash; Alle nieuwe gebruikers krijgen 14 dagen premium functionaliteit volledig gratis
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row gap-8 justify-center items-stretch mb-12">
          {/* Basic Plan */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border border-blue-200 flex flex-col p-8 min-w-[320px] max-w-[400px]">
            <div className="flex items-center mb-4">
              <Shield className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Basic</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">€11,95</span>
              <span className="text-gray-500 ml-2">per maand</span>
              <p className="text-gray-600 mt-2">Perfect om te beginnen</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-green-800 text-sm font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" /> 14 dagen gratis trial
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />50 documenten uploaden</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />100 vragen per dag</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Basis AI modellen</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />E-mail support</li>
            </ul>
            <div className="mt-auto">
              <button onClick={() => handleUpgrade('Basic')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center mb-2">
                Start Nu <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              {isAuthenticated && (
                <button onClick={handleStartTrial} className="w-full py-2 px-6 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                  Start Trial
                </button>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="flex-1 bg-white rounded-2xl shadow-lg border-2 border-green-500 flex flex-col p-8 min-w-[320px] max-w-[400px] relative">
            <div className="absolute top-0 right-0 bg-green-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">Meest Populair</div>
            <div className="flex items-center mb-4">
              <Crown className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="text-2xl font-bold text-gray-900">Premium</h3>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">€23,95</span>
              <span className="text-gray-500 ml-2">per maand</span>
              <p className="text-gray-600 mt-2">Voor professionals</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 text-green-800 text-sm font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2" /> 14 dagen gratis trial
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Onbeperkte documenten</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Onbeperkte vragen</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Premium AI modellen</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Prioriteit support</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />API toegang</li>
              <li className="flex items-start"><Check className="h-5 w-5 text-green-500 mr-3 mt-0.5" />Geavanceerde analytics</li>
            </ul>
            <div className="mt-auto">
              <button onClick={() => handleUpgrade('Premium')} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center mb-2">
                Start Nu <ArrowRight className="h-5 w-5 ml-2" />
              </button>
              {isAuthenticated && (
                <button onClick={handleStartTrial} className="w-full py-2 px-6 rounded-lg font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                  Start Trial
                </button>
              )}
            </div>
          </div>
        </div>

        {/* White Label Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-10 max-w-2xl mx-auto flex flex-col items-center shadow-xl transition-shadow hover:shadow-2xl">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-3 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="7" width="18" height="13" rx="2" className="fill-gray-100" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <h3 className="text-2xl font-bold text-gray-900">White Label</h3>
          </div>
          <p className="text-lg text-gray-600 mb-6 text-center">Zakelijke AI-oplossing volledig in uw eigen huisstijl, met maatwerk en dedicated support.</p>
          <div className="grid md:grid-cols-2 gap-6 mb-8 w-full">
            <div>
              <h4 className="text-base font-semibold mb-3 text-blue-900">Wat je krijgt:</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />Volledig maatwerk</li>
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />Eigen branding</li>
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />Dedicated support</li>
              </ul>
            </div>
            <div>
              <h4 className="text-base font-semibold mb-3 text-blue-900">Extra features:</h4>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />Custom integraties</li>
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />SLA garantie</li>
                <li className="flex items-center"><Check className="h-5 w-5 text-blue-800 mr-2" />On-site implementatie</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => handleUpgrade('White Label')}
            className="bg-blue-900 hover:bg-blue-800 text-white px-8 py-3 rounded-md font-semibold transition-all duration-200 shadow-md hover:scale-105 flex items-center mx-auto focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <Mail className="h-5 w-5 mr-2" /> Vraag offerte aan
          </button>
        </div>

        {/* Trial Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Wat krijg je tijdens je 14-dagen trial?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Functionaliteit</h3>
              <ul className="space-y-2">
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Onbeperkte documenten uploaden</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Onbeperkte vragen stellen</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Premium AI modellen</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Geen verplichting</span></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geen Verplichting</h3>
              <ul className="space-y-2">
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Geen creditcard vereist</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Automatisch stoppen na trial</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Eenvoudig upgraden of downgraden</span></li>
                <li className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-3" /><span className="text-gray-700">Alle data behouden</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Veelgestelde Vragen</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hoe werkt de 14-dagen trial?</h3>
              <p className="text-gray-700">Alle nieuwe gebruikers krijgen automatisch 14 dagen premium functionaliteit. Je kunt onbeperkt documenten uploaden en vragen stellen. Na 14 dagen kun je kiezen om te upgraden naar een betaald abonnement of downgraden naar Basic.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Kan ik mijn abonnement wijzigen?</h3>
              <p className="text-gray-700">Ja, je kunt op elk moment upgraden of downgraden. Wijzigingen worden direct toegepast en je betaalt alleen voor het verschil.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wat is White Label?</h3>
              <p className="text-gray-700">White Label is volledig maatwerk voor bedrijven. We passen de oplossing aan naar jouw wensen, inclusief eigen branding, custom integraties en dedicated support. Neem contact op voor een offerte.</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Heb je vragen?</h2>
          <p className="text-gray-600 mb-6">Ons team staat klaar om je te helpen</p>
          <a href="mailto:info@ragopmaat.nl" className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            <Mail className="h-5 w-5 mr-2" /> Contact Opnemen
          </a>
        </div>
      </div>
    </div>
  )
} 