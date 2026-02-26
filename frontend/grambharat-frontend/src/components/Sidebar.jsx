import { useState } from 'react'
import { Plus, Search, MessageSquare, Trash2, Settings, User, ChevronLeft, Moon, Sun } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat, darkMode, setDarkMode, personality, setPersonality, userName, setUserName }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [localPersonality, setLocalPersonality] = useState(personality)
  const [localUserName, setLocalUserName] = useState(userName)

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSaveSettings = () => {
    setPersonality(localPersonality)
    setUserName(localUserName)
    setShowSettings(false)
  }

  const handleOpenSettings = () => {
    setLocalPersonality(personality)
    setLocalUserName(userName)
    setShowSettings(true)
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

          <div className="settings-body">
            {/* Username */}
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

            {/* Theme Toggle */}
            <div className="settings-group">
              <label className="settings-label">Theme</label>
              <div className="theme-switch-row">
                <span className="theme-label-text">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                <button className="theme-switch-btn" onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>

            {/* Personality / System Prompt */}
            <div className="settings-group">
              <label className="settings-label">Model Personality</label>
              <p className="settings-hint">This prompt is sent with every message to shape the AI's behavior and tone.</p>
              <textarea
                className="settings-textarea"
                value={localPersonality}
                onChange={(e) => setLocalPersonality(e.target.value)}
                placeholder="e.g. You are a helpful rural development expert who speaks in simple Hindi and English. Always provide practical, actionable advice..."
                rows={6}
              />
            </div>

            <button className="settings-save-btn" onClick={handleSaveSettings}>
              Save Settings
            </button>
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
