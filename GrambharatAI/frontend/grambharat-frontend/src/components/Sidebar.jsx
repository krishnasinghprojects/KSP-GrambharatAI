import { useState, useEffect } from 'react'
import { Plus, Search, MessageSquare, Trash2, Settings, User, ChevronLeft, Moon, Sun, UserCircle, MapPin, Brain } from 'lucide-react'
import './Sidebar.css'

const SEASONS = ['Summer', 'Monsoon', 'Winter', 'Spring']

const Sidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, darkMode, setDarkMode, personality, setPersonality, userName, setUserName }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState('general') // general, personas, context, memories
  
  // General settings
  const [localUserName, setLocalUserName] = useState(userName)
  
  // Personas
  const [personas, setPersonas] = useState([])
  const [selectedPersona, setSelectedPersona] = useState(personality)
  
  // Context
  const [context, setContext] = useState({
    season: 'Summer',
    location: '',
    cropCycle: '',
    festival: ''
  })
  
  // Memories
  const [memories, setMemories] = useState([])

  useEffect(() => {
    if (showSettings) {
      loadPersonas()
      loadContext()
      loadMemories()
    }
  }, [showSettings])

  const loadPersonas = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/personas')
      const data = await response.json()
      setPersonas(data)
    } catch (error) {
      console.error('Error loading personas:', error)
    }
  }

  const loadContext = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/context')
      const data = await response.json()
      setContext(data)
    } catch (error) {
      console.error('Error loading context:', error)
    }
  }

  const loadMemories = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/memories')
      const data = await response.json()
      setMemories(data.memories || [])
    } catch (error) {
      console.error('Error loading memories:', error)
    }
  }

  const saveContext = async () => {
    try {
      await fetch('http://localhost:3000/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context)
      })
      alert('Context saved successfully!')
    } catch (error) {
      console.error('Error saving context:', error)
      alert('Failed to save context')
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveSettings = () => {
    setPersonality(selectedPersona)
    setUserName(localUserName)
    setShowSettings(false)
  }

  const handleOpenSettings = () => {
    setLocalUserName(userName)
    setSelectedPersona(personality)
    setShowSettings(true)
    setSettingsTab('general')
  }

  const getCategoryColor = (category) => {
    const colors = {
      personal: '#2196F3',
      agricultural: '#4CAF50',
      financial: '#FF9800',
      family: '#E91E63',
      preferences: '#9C27B0',
      other: '#607D8B'
    }
    return colors[category] || colors.other
  }

  return (
    <div className="sidebar">
      {showSettings ? (
        /* ── Settings Panel ── */
        <div className="settings-panel">
          <div className="settings-header">
            <button className="settings-back-btn" onClick={() => setShowSettings(false)}>
              <ChevronLeft size={20} />
            </button>
            <h2>Settings</h2>
          </div>

          {/* Settings Tabs */}
          <div className="settings-tabs">
            <button
              className={`settings-tab ${settingsTab === 'general' ? 'active' : ''}`}
              onClick={() => setSettingsTab('general')}
            >
              <Settings size={16} />
              General
            </button>
            <button
              className={`settings-tab ${settingsTab === 'personas' ? 'active' : ''}`}
              onClick={() => setSettingsTab('personas')}
            >
              <UserCircle size={16} />
              Personas
            </button>
            <button
              className={`settings-tab ${settingsTab === 'context' ? 'active' : ''}`}
              onClick={() => setSettingsTab('context')}
            >
              <MapPin size={16} />
              Context
            </button>
            <button
              className={`settings-tab ${settingsTab === 'memories' ? 'active' : ''}`}
              onClick={() => setSettingsTab('memories')}
            >
              <Brain size={16} />
              Memories
            </button>
          </div>

          <div className="settings-body">
            {/* General Tab */}
            {settingsTab === 'general' && (
              <>
                <div className="settings-group">
                  <label className="settings-label">Display Name</label>
                  <input
                    className="settings-input"
                    type="text"
                    value={localUserName}
                    onChange={(e) => setLocalUserName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>

                <div className="settings-group">
                  <label className="settings-label">Theme</label>
                  <div className="theme-switch-row">
                    <span className="theme-label-text">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                    <button className="theme-switch-btn" onClick={() => setDarkMode(!darkMode)}>
                      {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                  </div>
                </div>

                <button className="settings-save-btn" onClick={handleSaveSettings}>
                  Save Settings
                </button>
              </>
            )}

            {/* Personas Tab */}
            {settingsTab === 'personas' && (
              <>
                <div className="settings-group">
                  <label className="settings-label">AI Personality</label>
                  <p className="settings-hint">Choose how the AI should respond to you</p>
                  
                  {/* Default Option */}
                  <div
                    className={`persona-card ${selectedPersona === '' ? 'selected' : ''}`}
                    onClick={() => setSelectedPersona('')}
                  >
                    <div className="persona-header">
                      <h4>Default</h4>
                      {selectedPersona === '' && <div className="selected-dot"></div>}
                    </div>
                    <p className="persona-desc">Standard helpful assistant</p>
                  </div>

                  {/* Dynamic Personas */}
                  {personas.map((persona) => (
                    <div
                      key={persona.id}
                      className={`persona-card ${selectedPersona === persona.description ? 'selected' : ''}`}
                      onClick={() => setSelectedPersona(persona.description)}
                    >
                      <div className="persona-header">
                        <h4>{persona.name}</h4>
                        {selectedPersona === persona.description && <div className="selected-dot"></div>}
                      </div>
                      <p className="persona-desc">{persona.description.substring(0, 100)}...</p>
                    </div>
                  ))}

                  {/* Custom Persona */}
                  <div className="settings-group" style={{ marginTop: '16px' }}>
                    <label className="field-label">Custom Personality</label>
                    <p className="settings-hint">Write your own custom instructions for the AI</p>
                    <textarea
                      className="settings-textarea"
                      value={selectedPersona && !personas.find(p => p.description === selectedPersona) ? selectedPersona : ''}
                      onChange={(e) => setSelectedPersona(e.target.value)}
                      placeholder="e.g., You are a helpful assistant who speaks in simple Hindi and English..."
                      rows={4}
                    />
                  </div>
                </div>

                <button className="settings-save-btn" onClick={handleSaveSettings}>
                  Apply Persona
                </button>
              </>
            )}

            {/* Context Tab */}
            {settingsTab === 'context' && (
              <>
                <div className="settings-group">
                  <label className="settings-label">Local Context</label>
                  <p className="settings-hint">Help AI understand your local environment</p>
                  
                  {/* Season */}
                  <div className="context-field">
                    <label className="field-label">Current Season</label>
                    <div className="season-buttons">
                      {SEASONS.map((season) => (
                        <button
                          key={season}
                          className={`season-btn ${context.season === season ? 'selected' : ''}`}
                          onClick={() => setContext({ ...context, season })}
                        >
                          {season}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="context-field">
                    <label className="field-label">Village/Location</label>
                    <input
                      className="settings-input"
                      type="text"
                      value={context.location}
                      onChange={(e) => setContext({ ...context, location: e.target.value })}
                      placeholder="e.g., Sultanpur, UP"
                    />
                  </div>

                  {/* Crop Cycle */}
                  <div className="context-field">
                    <label className="field-label">Current Crop Cycle</label>
                    <input
                      className="settings-input"
                      type="text"
                      value={context.cropCycle}
                      onChange={(e) => setContext({ ...context, cropCycle: e.target.value })}
                      placeholder="e.g., Wheat sowing season"
                    />
                  </div>

                  {/* Festival */}
                  <div className="context-field">
                    <label className="field-label">Current Festival/Event</label>
                    <input
                      className="settings-input"
                      type="text"
                      value={context.festival}
                      onChange={(e) => setContext({ ...context, festival: e.target.value })}
                      placeholder="e.g., Diwali, Holi, Market Day"
                    />
                  </div>
                </div>

                <button className="settings-save-btn" onClick={saveContext}>
                  Save Context
                </button>
              </>
            )}

            {/* Memories Tab */}
            {settingsTab === 'memories' && (
              <>
                <div className="settings-group">
                  <label className="settings-label">Saved Memories</label>
                  <p className="settings-hint">Information the AI remembers about you ({memories.length} items)</p>
                  
                  {memories.length === 0 ? (
                    <div className="no-memories">
                      <p>No memories saved yet. Ask the AI to remember something!</p>
                    </div>
                  ) : (
                    <div className="memories-list">
                      {memories.map((memory) => (
                        <div key={memory.id} className="memory-card">
                          <div className="memory-header">
                            <span
                              className="category-badge"
                              style={{ backgroundColor: getCategoryColor(memory.category) }}
                            >
                              {memory.category}
                            </span>
                            <span className="memory-date">{memory.createdAt}</span>
                          </div>
                          <p className="memory-content">{memory.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button className="settings-save-btn" onClick={loadMemories}>
                  Refresh Memories
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Normal Sidebar ── */
        <>
          <div className="sidebar-header">
            <div className="logo">
              <img src="/grambharatlogo.png" alt="GramBharat AI" className="logo-image" />
              <h1>GramBharat AI</h1>
            </div>
            <button className="new-chat-btn" onClick={onNewChat}>
              <Plus size={20} />
              <span>New Chat</span>
            </button>
          </div>

          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="chat-list">
            {filteredChats.map(chat => (
              <div
                key={chat.id}
                className={`chat-item ${currentChatId === chat.id ? 'active' : ''}`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="chat-item-content">
                  <MessageSquare size={18} className="chat-icon" />
                  <span className="chat-title">{chat.title}</span>
                </div>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* ── User Panel ── */}
          <div className="user-panel">
            <div className="user-info">
              <div className="user-avatar">
                <User size={18} />
              </div>
              <span className="user-name">{userName || 'User'}</span>
            </div>
            <button className="user-settings-btn" onClick={handleOpenSettings} title="Settings">
              <Settings size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Sidebar
