import { useState } from 'react'
import { useRouter } from 'next/router'
import { 
  Brain, 
  Search, 
  FileText, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Slimme Document Zoekfunctie",
      description: "Vind snel relevante informatie in uw documenten met geavanceerde AI-zoektechnologie."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Automatische Documentverwerking",
      description: "Upload PDF's, Word-documenten en meer. Ons systeem verwerkt alles automatisch."
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Veilige & Betrouwbare Opslag",
      description: "Uw documenten worden veilig opgeslagen en zijn alleen toegankelijk voor geautoriseerde gebruikers."
    },
    {
      icon: <Zap className="h-8 w-8" />,
      title: "Snelle & Nauwkeurige Antwoorden",
      description: "Krijg direct antwoorden op uw vragen met bronverwijzingen naar de relevante documenten."
    }
  ]

  const benefits = [
    "Tijdbesparende documentanalyse",
    "Verbeterde besluitvorming",
    "Centrale kennisopslag",
    "Eenvoudige toegang tot informatie",
    "Professionele presentatie van resultaten",
    "24/7 beschikbaarheid"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-gradient text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold">RAG op Maat</h1>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => router.push('/pricing')}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Abonnementen
              </button>
              <button
                onClick={() => router.push('/login')}
                className="text-white hover:text-gray-200 transition-colors"
              >
                Inloggen
              </button>
              <button
                onClick={() => router.push('/register')}
                className="btn-outline border-white text-white hover:bg-white hover:text-green-700"
              >
                Registreren
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="header-gradient text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="fade-in">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Slimme Documentanalyse
              <span className="block text-green-200">voor Professionals</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-100 max-w-3xl mx-auto">
              Transformeer uw documenten in waardevolle kennis met onze geavanceerde AI-gedreven zoek- en analyseplatform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/register')}
                className="btn-primary text-lg px-8 py-4"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                Start Gratis
                <ArrowRight className={`h-5 w-5 ml-2 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
              </button>
              <button
                onClick={() => router.push('/login')}
                className="btn-outline border-white text-white hover:bg-white hover:text-green-700 text-lg px-8 py-4"
              >
                Demo Bekijken
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Waarom RAG op Maat?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ons platform combineert de kracht van AI met gebruiksvriendelijkheid om uw documenten toegankelijk en waardevol te maken.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card-hover text-center group">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <div className="text-green-700">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Voordelen voor uw Organisatie
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                RAG op Maat helpt uw team om sneller en efficiënter te werken door documenten toegankelijk en doorzoekbaar te maken.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="card-hover">
              <div className="bg-gradient-to-br from-green-50 to-blue-50 p-8 rounded-xl">
                <div className="text-center">
                  <Users className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Geschikt voor Teams
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Werk samen met uw team aan documentanalyse en kennisontwikkeling.
                  </p>
                  <div className="flex justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">4.9/5 gebruikerswaardering</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Klaar om te Starten?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Registreer nu en begin met het analyseren van uw documenten in minder dan 5 minuten.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-white text-green-700 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg hover:shadow-xl"
          >
            Gratis Account Aanmaken
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Brain className="h-8 w-8 mr-2" />
                <span className="text-xl font-bold">RAG op Maat</span>
              </div>
              <p className="text-gray-400">
                Slimme documentanalyse voor professionals.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Functies</a></li>
                <li><button onClick={() => router.push('/pricing')} className="hover:text-white transition-colors">Abonnementen</button></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentatie</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Bedrijf</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Over ons</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Voorwaarden</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RAG op Maat. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 