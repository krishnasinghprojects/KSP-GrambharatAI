import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'
import './ChatArea.css'
import Message from './Message'
import ThinkingAnimation from './ThinkingAnimation'

const ChatArea = ({ chatId, selectedModel, onChatUpdate, personality }) => {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const [thinkingStatus, setThinkingStatus] = useState('')
  const [toolCalling, setToolCalling] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (chatId) {
      fetchMessages()
    } else {
      setMessages([])
    }
  }, [chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking, streamingMessage])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }

  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/chats/${chatId}/messages`)
      const data = await response.json()
      setMessages(data)
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || !chatId || isThinking) return

    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages([...messages, userMessage])
    setInput('')
    setIsThinking(true)
    setStreamingMessage('')
    setThinkingStatus('')
    setToolCalling(false)

    try {
      const response = await fetch(`http://localhost:3000/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, model: selectedModel, personality })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.status) {
                setThinkingStatus(data.status)
              }

              if (data.toolCalling) {
                setToolCalling(true)
              }

              if (data.token) {
                accumulatedText += data.token
                setStreamingMessage(accumulatedText)
                setThinkingStatus('')
                setToolCalling(false)
              }

              if (data.done) {
                setIsThinking(false)
                setStreamingMessage('')
                setThinkingStatus('')
                setToolCalling(false)
                await fetchMessages()
                onChatUpdate()
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setIsThinking(false)
      setStreamingMessage('')
      setThinkingStatus('')
      setToolCalling(false)
    }
  }

  const regenerateResponse = async () => {
    if (messages.length < 2 || isThinking) return

    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (!lastUserMessage) return

    setIsThinking(true)
    setStreamingMessage('')
    setThinkingStatus('')
    setToolCalling(false)

    try {
      const response = await fetch(`http://localhost:3000/api/chats/${chatId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: lastUserMessage.content, model: selectedModel, personality })
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.status) {
                setThinkingStatus(data.status)
              }

              if (data.toolCalling) {
                setToolCalling(true)
              }

              if (data.token) {
                accumulatedText += data.token
                setStreamingMessage(accumulatedText)
                setThinkingStatus('')
                setToolCalling(false)
              }

              if (data.done) {
                setIsThinking(false)
                setStreamingMessage('')
                setThinkingStatus('')
                setToolCalling(false)
                await fetchMessages()
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Error regenerating response:', error)
      setIsThinking(false)
      setStreamingMessage('')
      setThinkingStatus('')
      setToolCalling(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!chatId) {
    return (
      <div className="chat-area">
        <div className="empty-state">
          <img src="/grambharatlogo.png" alt="GramBharat AI" className="empty-logo" />
          <h2>Welcome to GramBharat AI</h2>
          <p>Start a new conversation to begin</p>
        </div>
      </div>
    )
  }

  const lastAIMessageIndex = messages.length > 0 && messages[messages.length - 1]?.role === 'assistant'
    ? messages.length - 1
    : -1

  return (
    <div className="chat-area">
      <div className="messages-container">
        {messages.map((message, index) => (
          <Message
            key={index}
            message={message}
            messageIndex={index}
            chatId={chatId}
            onRegenerate={index === lastAIMessageIndex ? regenerateResponse : null}
            isLastAI={index === lastAIMessageIndex}
          />
        ))}
        {isThinking && <ThinkingAnimation streamingText={streamingMessage} status={thinkingStatus} toolCalling={toolCalling} />}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message GramBharat AI..."
            rows="1"
          />
          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isThinking}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatArea
