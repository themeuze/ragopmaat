import { useEffect, useState } from 'react'
import { useAuth } from '../components/AuthContext'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { CheckCircle, Trash2, Edit, Plus, LogOut, Brain, Home, Users, AlertCircle, Clock, Crown, Shield, Star } from 'lucide-react'

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading, fetchUsers, createUser, updateUser, deleteUser, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    role: 'user',
    tier: 'basic',
    is_active: true,
    start_trial: false
  })
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    
    if (!isAdmin) {
      router.push('/login')
      return
    }
    loadUsers()
  }, [isAdmin, authLoading])

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchUsers()
      setUsers(data)
    } catch (err) {
      setError('Kan gebruikers niet laden')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await createUser(form)
      setSuccess('Gebruiker aangemaakt!')
      setShowForm(false)
      setForm({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'user',
        tier: 'basic',
        is_active: true,
        start_trial: false
      })
      loadUsers()
    } catch (err) {
      setError('Fout bij aanmaken gebruiker')
    }
  }

  const handleEdit = (user) => {
    setEditUser(user)
    setForm({ 
      username: user.username, 
      email: user.email, 
      password: '', 
      role: user.role,
      tier: user.tier,
      is_active: user.is_active,
      start_trial: false
    })
    setShowForm(true)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      await updateUser(editUser.id, form)
      setSuccess('Gebruiker bijgewerkt!')
      setShowForm(false)
      setEditUser(null)
      setForm({ 
        username: '', 
        email: '', 
        password: '', 
        role: 'user',
        tier: 'basic',
        is_active: true,
        start_trial: false
      })
      loadUsers()
    } catch (err) {
      setError('Fout bij bijwerken gebruiker')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Weet je zeker dat je deze gebruiker wilt verwijderen?')) return
    setError('')
    setSuccess('')
    try {
      await deleteUser(id)
      setSuccess('Gebruiker verwijderd!')
      loadUsers()
    } catch (err) {
      setError('Fout bij verwijderen gebruiker')
    }
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const handleStartTrial = async (userId) => {
    const days = prompt('Aantal dagen voor trial (standaard 14):', '14')
    if (!days || isNaN(days)) return
    
    setError('')
    setSuccess('')
    try {
      const response = await fetch(`/api/users/${userId}/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ days: parseInt(days) })
      })
      
      if (!response.ok) {
        throw new Error('Fout bij starten trial')
      }
      
      setSuccess('Trial succesvol gestart!')
      loadUsers()
    } catch (err) {
      setError('Fout bij starten trial')
    }
  }

  const getTierColor = (tier) => {
    switch (tier) {
      case 'premium': return 'bg-green-100 text-green-800'
      case 'white_label': return 'bg-purple-100 text-purple-800'
      case 'basic': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'premium': return <Crown className="h-4 w-4" />
      case 'white_label': return <Star className="h-4 w-4" />
      case 'basic': return <Shield className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  const getTrialStatusColor = (user) => {
    if (!user.is_trial_active) return 'bg-gray-100 text-gray-800'
    if (user.days_left_in_trial > 7) return 'bg-green-100 text-green-800'
    if (user.days_left_in_trial > 0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getEffectiveTier = (user) => {
    if (user.is_in_trial) {
      return 'premium (trial)'
    }
    return user.tier
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="header-gradient text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Brain className="h-10 w-10 mr-3" />
              <h1 className="text-2xl font-bold">RAG op Maat Admin</h1>
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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Users className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-3xl font-bold text-gray-900">Gebruikersbeheer</h2>
          </div>
          <p className="text-gray-600">Beheer gebruikersaccounts, rollen en trial periodes in het systeem.</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="alert-error mb-6 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="alert-success mb-6 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2" />
            {success}
          </div>
        )}

        {/* Users Table Card */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Gebruikers</h3>
            <button 
              onClick={() => { 
                setShowForm(true); 
                setEditUser(null); 
                setForm({ 
                  username: '', 
                  email: '', 
                  password: '', 
                  role: 'user',
                  tier: 'basic',
                  is_active: true,
                  start_trial: false
                }) 
              }} 
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nieuwe gebruiker
            </button>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Gebruikers laden...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gebruikersnaam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonnement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trial Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dagen Over</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          u.role === 'admin' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTierColor(u.tier)}`}>
                            {getTierIcon(u.tier)}
                            {getEffectiveTier(u)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {u.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTrialStatusColor(u)}`}>
                          {u.is_trial_active ? (u.days_left_in_trial > 0 ? 'Actief' : 'Verlopen') : 'Geen Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {u.is_trial_active ? u.days_left_in_trial : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleEdit(u)} 
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Bewerk
                        </button>
                        <button 
                          onClick={() => handleStartTrial(u.id)} 
                          className="text-purple-600 hover:text-purple-900 flex items-center"
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Trial
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)} 
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Verwijder
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editUser ? 'Bewerk gebruiker' : 'Nieuwe gebruiker'}
            </h3>
            <form onSubmit={editUser ? handleUpdate : handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Gebruikersnaam</label>
                  <input 
                    type="text" 
                    name="username" 
                    value={form.username} 
                    onChange={handleFormChange} 
                    required 
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={form.email} 
                    onChange={handleFormChange} 
                    required 
                    className="input-field"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">
                    Wachtwoord {editUser && <span className="text-gray-400">(leeg laten = niet wijzigen)</span>}
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    value={form.password} 
                    onChange={handleFormChange} 
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rol</label>
                  <select 
                    name="role" 
                    value={form.role} 
                    onChange={handleFormChange} 
                    className="input-field"
                  >
                    <option value="user">Gebruiker</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Abonnement</label>
                  <select 
                    name="tier" 
                    value={form.tier} 
                    onChange={handleFormChange} 
                    className="input-field"
                  >
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="white_label">White Label</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select 
                    name="is_active" 
                    value={form.is_active ? 'true' : 'false'}
                    onChange={e => setForm({ ...form, is_active: e.target.value === 'true' })}
                    className="input-field"
                  >
                    <option value="true">Actief</option>
                    <option value="false">Inactief</option>
                  </select>
                </div>
              </div>
              {!editUser && (
                <div className="form-group">
                  <label className="form-label">Start Trial</label>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="start_trial"
                      checked={form.start_trial}
                      onChange={(e) => setForm({ ...form, start_trial: e.target.checked })}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Start 14-daagse trial bij aanmaken</span>
                  </div>
                </div>
              )}
              <div className="flex space-x-4 pt-4">
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  {editUser ? 'Opslaan' : 'Aanmaken'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { 
                    setShowForm(false); 
                    setEditUser(null); 
                    setForm({ 
                      username: '', 
                      email: '', 
                      password: '', 
                      role: 'user',
                      tier: 'basic',
                      is_active: true,
                      start_trial: false
                    }) 
                  }} 
                  className="btn-secondary"
                >
                  Annuleren
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
} 