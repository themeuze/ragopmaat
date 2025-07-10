import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import axios from 'axios'
import { 
  Brain, 
  Users, 
  FileText, 
  Upload, 
  Trash2, 
  LogOut,
  Home,
  Clock,
  Crown,
  Shield,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  BarChart3,
  Settings
} from 'lucide-react'
import Link from 'next/link'

export default function Admin() {
  const { user, logout, isAuthenticated, isAdmin, loading: authLoading } = useAuth()
  const router = useRouter()
  
  const [users, setUsers] = useState([])
  const [documents, setDocuments] = useState([])
  const [activeTab, setActiveTab] = useState('overview')
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkUploadResults, setBulkUploadResults] = useState(null)
  const [selectedFiles, setSelectedFiles] = useState([])

  useEffect(() => {
    if (authLoading) return
    
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }
    
    fetchUsers()
    fetchAllDocuments()
  }, [isAuthenticated, authLoading, isAdmin])

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/auth/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllDocuments = async () => {
    try {
      const response = await axios.get('/api/documents')
      setDocuments(response.data)
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const handleBulkUpload = async (event) => {
    event.preventDefault()
    if (selectedFiles.length === 0) return

    setBulkUploading(true)
    setBulkUploadResults(null)

    const formData = new FormData()
    selectedFiles.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await axios.post('/api/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setBulkUploadResults(response.data)
      fetchAllDocuments() // Refresh documents list
    } catch (error) {
      console.error('Bulk upload error:', error)
      setBulkUploadResults({
        message: 'Bulk upload failed: ' + (error.response?.data?.detail || error.message),
        summary: { total_files: 0, successful: 0, warnings: 0, errors: 1 },
        results: []
      })
    } finally {
      setBulkUploading(false)
      setSelectedFiles([])
    }
  }

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    setSelectedFiles(files)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return

    try {
      await axios.delete(`/api/auth/users/${userId}`)
      fetchUsers()
    } catch (error) {
      console.error('Delete user error:', error)
      alert('Delete failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Weet je zeker dat je dit document wilt verwijderen?')) return

    try {
      await axios.delete(`/api/documents/${documentId}`)
      fetchAllDocuments()
    } catch (error) {
      console.error('Delete document error:', error)
      alert('Delete failed: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!isAuthenticated || !isAdmin) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-gradient text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Crown className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center text-white hover:text-green-200 transition-colors">
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <span className="text-sm text-green-100">
                Admin: {user?.username}
              </span>
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
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span>Overzicht</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'users' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Gebruikers</span>
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
            onClick={() => setActiveTab('bulk-upload')}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-all duration-200 ${
              activeTab === 'bulk-upload' 
                ? 'bg-green-100 text-green-700 shadow-md' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Upload className="h-5 w-5" />
            <span>Bulk Upload</span>
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Gebruikers</h3>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documenten</h3>
                  <p className="text-2xl font-bold text-green-600">{documents.length}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <Crown className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Admins</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gebruikers Beheer</h2>
            
            {users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gebruiker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acties
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.tier === 'premium' 
                              ? 'bg-green-100 text-green-800'
                              : user.tier === 'white_label'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Actief' : 'Inactief'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
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
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nog geen gebruikers</h3>
                <p className="text-gray-500">Gebruikers verschijnen hier zodra ze zich registreren</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Alle Documenten</h2>
            
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
                        Gebruiker
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Chunks
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
                          {users.find(u => u.id === document.user_id)?.username || 'Onbekend'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            document.is_processed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {document.is_processed ? 'Verwerkt' : 'In behandeling'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.chunk_count}
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
                <p className="text-gray-500">Documenten verschijnen hier zodra ze worden geüpload</p>
              </div>
            )}
          </div>
        )}

        {/* Bulk Upload Tab */}
        {activeTab === 'bulk-upload' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bulk Document Upload</h2>
            
            <form onSubmit={handleBulkUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecteer meerdere bestanden
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  onChange={handleFileSelect}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  disabled={bulkUploading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Ondersteunde formaten: PDF, DOCX, TXT, MD. Maximaal 10 bestanden tegelijk.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Geselecteerde bestanden:</h3>
                  <ul className="space-y-1">
                    {selectedFiles.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="submit"
                disabled={bulkUploading || selectedFiles.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {bulkUploading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Uploaden...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Bulk Upload Starten
                  </>
                )}
              </button>
            </form>

            {/* Upload Results */}
            {bulkUploadResults && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Resultaten</h3>
                
                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{bulkUploadResults.summary.total_files}</div>
                      <div className="text-sm text-gray-500">Totaal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{bulkUploadResults.summary.successful}</div>
                      <div className="text-sm text-gray-500">Succesvol</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{bulkUploadResults.summary.warnings}</div>
                      <div className="text-sm text-gray-500">Waarschuwingen</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{bulkUploadResults.summary.errors}</div>
                      <div className="text-sm text-gray-500">Fouten</div>
                    </div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-3">
                  {bulkUploadResults.results.map((result, index) => (
                    <div key={index} className="flex items-center p-3 border rounded-lg">
                      {result.status === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mr-3" />}
                      {result.status === 'warning' && <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />}
                      {result.status === 'error' && <XCircle className="h-5 w-5 text-red-600 mr-3" />}
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{result.filename}</div>
                        <div className="text-sm text-gray-500">{result.message}</div>
                        {result.chunks > 0 && (
                          <div className="text-xs text-gray-400">{result.chunks} chunks gecreëerd</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 