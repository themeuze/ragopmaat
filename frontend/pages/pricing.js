import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { 
  Brain, 
  ArrowLeft, 
  CheckCircle, 
  Shield, 
  Zap, 
  Users, 
  Clock,
  Star,
  Crown,
  Sparkles
} from 'lucide-react'

export default function Pricing() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      const data = await response.json()
      setSubscriptions(data.tiers || [])
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const tiers = [
    {
      name: "Free",
      price: 0,
      period: "per maand",
      description: "Perfect om te beginnen",
      features: [
        "3 documenten uploaden",
        "5 vragen per dag",
        "Basis RAG functionaliteit",
        "PDF, DOCX, MD support",
        "E-mail support"
      ],
      popular: false,
      color: "from-gray-500 to-gray-600",
      buttonColor: "bg-gray-600 hover:bg-gray-700",
      icon: Shield
    },
    {
      name: "Basic",
      price: 5,
      period: "per maand",
      description: "Voor actieve gebruikers",
      features: [
        "100 documenten uploaden",
        "30 vragen per dag",
        "Geavanceerde AI-modellen",
        "Prioriteit support",
        "Document export",
        "Team samenwerking"
      ],
      popular: true,
      color: "from-green-500 to-green-600",
      buttonColor: "bg-green-600 hover:bg-green-700",
      icon: Zap
    },
    {
      name: "Premium",
      price: 20,
      period: "per maand",
      description: "Voor professionals",
      features: [
        "Onbeperkte documenten",
        "Onbeperkte vragen",
        "API toegang",
        "White-label optie",
        "Dedicated support",
        "Geavanceerde analytics",
        "Custom integraties"
      ],
      popular: false,
      color: "from-purple-500 to-purple-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      icon: Crown
    }
  ]

  const handleUpgrade = (tierName) => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    // Hier zou je naar een betalingspagina kunnen gaan
    alert(`Upgrade naar ${tierName} - Betalingsintegratie komt binnenkort!`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
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
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Kies uw abonnement
          </h2>
          <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
            Selecteer het plan dat het beste bij u past. U kunt altijd upgraden of downgraden.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl shadow-2xl border-2 ${
                tier.popular 
                  ? 'border-green-500 transform scale-105' 
                  : 'border-gray-100'
              } p-8`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    Meest populair
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tier.color} rounded-full mb-4`}>
                  <tier.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                <p className="text-gray-600 mb-4">{tier.description}</p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">€{tier.price}</span>
                  <span className="text-gray-600">/{tier.period}</span>
                </div>
                {tier.price === 0 && (
                  <p className="text-green-600 font-semibold">Gratis voor altijd</p>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.name)}
                className={`w-full ${tier.buttonColor} text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
              >
                {tier.price === 0 ? 'Gratis starten' : `Upgrade naar ${tier.name}`}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Veelgestelde vragen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Kan ik mijn abonnement wijzigen?
              </h4>
              <p className="text-gray-600">
                Ja, u kunt op elk moment upgraden of downgraden. Wijzigingen worden direct toegepast.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Is er een opzegtermijn?
              </h4>
              <p className="text-gray-600">
                Nee, u kunt uw abonnement op elk moment opzeggen zonder extra kosten.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Wat gebeurt er met mijn data?
              </h4>
              <p className="text-gray-600">
                Uw documenten en data blijven veilig opgeslagen, ook na het opzeggen van uw abonnement.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Is er een gratis proefperiode?
              </h4>
              <p className="text-gray-600">
                Ja, alle betaalde abonnementen hebben een 14-dagen gratis proefperiode.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-12 text-white">
            <Sparkles className="h-16 w-16 mx-auto mb-6 text-green-200" />
            <h3 className="text-3xl font-bold mb-4">
              Klaar om te beginnen?
            </h3>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Start vandaag nog met slimme documentanalyse en ontdek hoe AI uw werk kan verbeteren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-green-600 hover:bg-green-50 font-semibold py-3 px-8 rounded-xl transition-all duration-200 text-lg"
              >
                Gratis account aanmaken
              </Link>
              <Link
                href="/login"
                className="border-2 border-white text-white hover:bg-white hover:text-green-600 font-semibold py-3 px-8 rounded-xl transition-all duration-200 text-lg"
              >
                Inloggen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 