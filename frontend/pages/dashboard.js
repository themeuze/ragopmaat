import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import axios from 'axios'
import { 
  Brain, 
  Upload, 
  FileText, 
  Search, 
  Trash2, 
  LogOut,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Home,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { user, logout, isAuthenticated, isAdmin, loading: authLoading, isInTrial, getEffectiveTier, getTierLimits } = useAuth()
  const router = useRouter()
  
  const [documents, setDocuments] = useState([])
  const [queries, setQueries] = useState([])
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState('chat')
  const [expandedSources, setExpandedSources] = useState({})
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [documentFilter, setDocumentFilter] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  const [responseWarning, setResponseWarning] = useState("")
  const [processingTime, setProcessingTime] = useState(null)

  useEffect(() => {
    // Wacht tot de authenticatie is geladen
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    fetchDocuments()
    fetchQueries()
  }, [isAuthenticated, authLoading])

  // Progress simulation for better UX
  useEffect(() => {
    let interval
    if (loading) {
      setLoadingProgress(0)
      setLoadingMessage('Zoeken naar relevante documenten...')
      
      interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev < 90) {
            const newProgress = prev + Math.random() * 15
            if (newProgress > 30 && newProgress < 60) {
              setLoadingMessage('Documenten geanalyseerd, AI genereert antwoord...')
            } else if (newProgress > 60) {
              setLoadingMessage('Antwoord wordt afgemaakt...')
            }
            return Math.min(newProgress, 90)
          }
          return prev
        })
      }, 1000)
    } else {
      setLoadingProgress(0)
      setLoadingMessage('')
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loading])

  // Timeout warning after 30 seconds
  useEffect(() => {
    let timeout
    if (loading) {
      timeout = setTimeout(() => {
        setShowTimeoutWarning(true)
      }, 30000) // 30 seconds
    } else {
      setShowTimeoutWarning(false)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [loading])

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/api/documents')
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchQueries = async () => {
    try {
      const response = await axios.get('/api/queries')
      setQueries(response.data)
    } catch (error) {
      console.error('Error fetching queries:', error)
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      fetchDocuments()
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) return

    try {
      await axios.delete(`/api/documents/${documentId}`)
      fetchDocuments()
    } catch (error) {
      console.error('Delete error:', error)
      alert('Delete failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteQuery = async (queryId) => {
    if (!confirm('Weet je zeker dat je deze vraag uit de geschiedenis wilt verwijderen?')) return

    try {
      await axios.delete(`/api/queries/${queryId}`)
      fetchQueries()
    } catch (error) {
      console.error('Delete query error:', error)
      alert('Delete failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteAllQueries = async () => {
    if (!confirm('Weet je zeker dat je alle vragen uit de geschiedenis wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return

    try {
      await axios.delete('/api/queries')
      fetchQueries()
    } catch (error) {
      console.error('Delete all queries error:', error)
      alert('Delete failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleSubmitQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    setLoading(true)
    setAnswer('')
    setSources([])
    setLoadingProgress(0)
    setShowTimeoutWarning(false)
    setResponseWarning("")
    setProcessingTime(null)

    try {
      const response = await axios.post('/api/query', {
        question: question,
        document_id: selectedDocument
      })

      setLoadingProgress(100)
      setLoadingMessage('Antwoord gereed!')

      // Small delay to show completion
      setTimeout(() => {
        setAnswer(response.data.answer || '')
        setSources(response.data.sources)
        setDocumentFilter(selectedDocument ? documents.find(d => d.id === selectedDocument)?.original_filename : '')
        setResponseWarning(response.data.warning || '')
        setProcessingTime(response.data.processing_time || null)
        fetchQueries()
        setLoading(false)
      }, 500)

    } catch (error) {
      console.error('Query error:', error)
      setAnswer('Er is een fout opgetreden: ' + (error.response?.data?.detail || error.message))
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const toggleSourceExpansion = (sourceId) => {
    setExpandedSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }))
  }

  const cancelRequest = () => {
    setLoading(false)
    setAnswer('Vraag geannuleerd door gebruiker.')
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-gradient text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold">RAG op Maat Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center text-white hover:text-green-200 transition-colors">
                <Home className="h-5 w-5 mr-2" />
                Home
              </Link>
              <div className="flex items-center space-x-4">
                {/* Trial Banner */}
                {isInTrial && (
                  <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Trial: {user?.days_left_in_trial} dagen
                  </div>
                )}
                {/* Tier Info */}
                <span className="text-sm text-green-100">
                  Welkom, {user?.username} ({getEffectiveTier()})
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-white hover:text-green-200 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-1" />
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-8 mb-8">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'chat' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'documents' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Documenten</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'history' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Clock className="h-5 w-5" />
            <span>Geschiedenis</span>
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <Brain className="h-5 w-5" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Stel een vraag</h2>
                
                <form onSubmit={handleSubmitQuestion} className="space-y-4">
                  {/* Document Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document filter (optioneel)
                    </label>
                    <select
                      value={selectedDocument || ''}
                      onChange={(e) => setSelectedDocument(e.target.value || null)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="">Alle documenten</option>
                      {documents.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.original_filename}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Question Input */}
                  <div className="flex flex-col md:flex-row md:items-end md:space-x-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Uw vraag
                      </label>
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Stel uw vraag hier..."
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                        rows="4"
                        disabled={loading}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setQuestion('');
                        setAnswer('');
                        setSources([]);
                        setResponseWarning("");
                        setProcessingTime(null);
                        setDocumentFilter('');
                        setSelectedDocument(null); // Reset document selectie
                      }}
                      className="mt-4 md:mt-0 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                      disabled={loading && 'disabled'}
                      style={{ minWidth: 160 }}
                    >
                      Nieuwe vraag
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading || !question.trim()}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Bezig...
                      </>
                    ) : (
                      <>
                        <Search className="h-5 w-5 mr-2" />
                        Vraag stellen
                      </>
                    )}
                  </button>
                </form>

                {/* Loading Progress */}
                {loading && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-800">{loadingMessage}</span>
                      <span className="text-sm text-blue-600">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${loadingProgress}%` }}
                      ></div>
                    </div>
                    
                    {/* Timeout Warning */}
                    {showTimeoutWarning && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                          <span className="text-sm text-yellow-800">
                            Het duurt langer dan verwacht. Dit is normaal voor complexe vragen op lokale hardware.
                          </span>
                        </div>
                        <button
                          onClick={cancelRequest}
                          className="mt-2 text-sm text-yellow-700 hover:text-yellow-800 underline"
                        >
                          Vraag annuleren
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Warning Display */}
                {responseWarning && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">{responseWarning}</span>
                  </div>
                )}
                {/* Answer Display */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Antwoord</h3>
                  <div className="bg-white p-6 rounded-xl border border-green-200 shadow-md">
                    <div className="prose max-w-none text-lg text-gray-900">
                      {answer && answer.trim() !== '' ? (
                        answer.split('\n').map((line, index) => (
                          <p key={index} className="mb-2 last:mb-0">
                            {line}
                          </p>
                        ))
                      ) : (
                        <span className="text-gray-400">Er is geen antwoord gevonden.</span>
                      )}
                    </div>
                  </div>
                  {processingTime && (
                    <div className="mt-2 text-xs text-gray-500 text-right">⏱️ Verwerkingstijd: {processingTime.toFixed(1)} seconden</div>
                  )}
                </div>
              </div>
            </div>

            {/* Sources Panel */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Bronnen ({sources.length})
                </h3>
                
                {documentFilter && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800">
                        Gefilterd op: {documentFilter}
                      </span>
                    </div>
                  </div>
                )}

                {sources.length > 0 ? (
                  <div className="space-y-3">
                    {sources.map((source, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Bron {source.id}
                          </span>
                          <button
                            onClick={() => toggleSourceExpansion(index)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {expandedSources[index] ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        
                        {expandedSources[index] ? (
                          <div className="mt-2 text-sm text-gray-600">
                            {source.content}
                          </div>
                        ) : (
                          <div className="mt-2 text-sm text-gray-600">
                            {source.content.substring(0, 100)}...
                          </div>
                        )}
                        
                        {source.metadata && source.metadata.file_path && (
                          <div className="mt-2 text-xs text-gray-500">
                            Bestand: {source.metadata.file_path.split('/').pop()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Nog geen bronnen beschikbaar</p>
                    <p className="text-sm">Stel een vraag om bronnen te zien</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Documenten</h2>
              <label className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Upload className="h-5 w-5 inline mr-2" />
                Document uploaden
                <input
                  type="file"
                  accept=".pdf,.txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>

            {uploading && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-blue-600" />
                  <span className="text-blue-800">Document wordt geüpload en verwerkt...</span>
                </div>
              </div>
            )}

            {documents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Bestandsnaam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Upload datum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {document.original_filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.file_type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(document.uploaded_at).toLocaleDateString('nl-NL')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen documenten</h3>
                <p className="text-gray-500">Upload uw eerste document om te beginnen</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Vraag Geschiedenis</h2>
              {queries.length > 0 && (
                <button
                  onClick={handleDeleteAllQueries}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors text-sm flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Alles verwijderen
                </button>
              )}
            </div>
            
            {queries.length > 0 ? (
              <div className="space-y-4">
                {queries.map((query) => (
                  <div key={query.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{query.question}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(query.timestamp).toLocaleString('nl-NL')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteQuery(query.id)}
                        className="text-red-600 hover:text-red-900 ml-2 p-1"
                        title="Verwijder deze vraag"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">{query.answer}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen vragen gesteld</h3>
                <p className="text-gray-500">Stel uw eerste vraag om geschiedenis te zien</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 