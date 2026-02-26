import { useState } from 'react'
import { Plus, Search, MessageSquare, Trash2 } from 'lucide-react'
import './Sidebar.css'

const Sidebar = ({ chats, currentChatId, onSelectChat, onNewChat, onDeleteChat }) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredChats = chats.filter(chat =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="sidebar">
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
    </div>
  )
}

export default Sidebar
