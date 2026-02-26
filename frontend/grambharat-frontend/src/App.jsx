import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import './App.css'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import EarthquakeNotification from './components/EarthquakeNotification'

const AVAILABLE_MODELS = [
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B' },
  { id: 'gemma2:latest', name: 'Gemma 2 Latest' },
  { id: 'llama3.1:8b', name: 'Llama 3.1 8B' }
]

function App() {
  const [chats, setChats] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('grambharat-darkMode') === 'true'
  })
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id)
  const [socket, setSocket] = useState(null)
  const [personality, setPersonality] = useState(() => {
    return localStorage.getItem('grambharat-personality') || ''
  })
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('grambharat-userName') || 'User'
  })

  useEffect(() => {
    fetchChats()

    const newSocket = io('http://localhost:3000')
    setSocket(newSocket)

    newSocket.on('earthquake', (data) => {
      setNotification({
        message: data.message,
        timestamp: data.timestamp
      })
    })

    return () => newSocket.disconnect()
  }, [])

  useEffect(() => {
    document.body.className = darkMode ? 'dark-mode' : 'light-mode'
    localStorage.setItem('grambharat-darkMode', darkMode)
  }, [darkMode])

  useEffect(() => {
    localStorage.setItem('grambharat-personality', personality)
  }, [personality])

  useEffect(() => {
    localStorage.setItem('grambharat-userName', userName)
  }, [userName])

  const fetchChats = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/chats')
      const data = await response.json()
      setChats(data)
      if (data.length > 0 && !currentChatId) {
        setCurrentChatId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching chats:', error)
    }
  }

  const createNewChat = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/chats', {
        method: 'POST'
      })
      const newChat = await response.json()
      setChats([newChat, ...chats])
      setCurrentChatId(newChat.id)
    } catch (error) {
      console.error('Error creating chat:', error)
    }
  }

  const deleteChat = async (chatId) => {
    try {
      await fetch(`http://localhost:3000/api/chats/${chatId}`, {
        method: 'DELETE'
      })
      const updatedChats = chats.filter(chat => chat.id !== chatId)
      setChats(updatedChats)
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats[0]?.id || null)
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
    }
  }

  return (
    <div className="app">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={setCurrentChatId}
        onNewChat={createNewChat}
        onDeleteChat={deleteChat}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        personality={personality}
        setPersonality={setPersonality}
        userName={userName}
        setUserName={setUserName}
      />
      <div className="main-content">
        <div className="top-bar">
          <select
            className="model-selector"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>
        </div>
        <ChatArea
          chatId={currentChatId}
          selectedModel={selectedModel}
          onChatUpdate={fetchChats}
          personality={personality}
        />
      </div>
      {notification && (
        <EarthquakeNotification
          message={notification.message}
          timestamp={notification.timestamp}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  )
}

export default App
