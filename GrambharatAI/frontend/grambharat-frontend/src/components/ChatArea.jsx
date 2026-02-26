import { useState, useEffect, useRef } from 'react'
import { Send, Image as ImageIcon, X } from 'lucide-react'
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
  const [memorySaved, setMemorySaved] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const prevChatIdRef = useRef(chatId)

  // Reset everything when chatId changes
  useEffect(() => {
    // Check if chatId actually changed
    if (prevChatIdRef.current !== chatId) {
      console.log('🔄 Chat changed from', prevChatIdRef.current, 'to', chatId)
      prevChatIdRef.current = chatId
      
      // Reset all state
      setMessages([])
      setInput('')
      setIsThinking(false)
      setStreamingMessage('')
      setThinkingStatus('')
      setToolCalling(false)
      setMemorySaved(false)
      setSelectedImage(null)
      setImagePreview(null)
      
      // Load new messages
      if (chatId) {
        fetchMessages()
      }
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
    if (!chatId) return
    
    try {
      console.log('📥 Fetching messages for chat:', chatId)
      const response = await fetch(`http://localhost:3000/api/chats/${chatId}/messages`)
      const data = await response.json()
      console.log('✅ Loaded', data.length, 'messages')
      setMessages(data)
    } catch (error) {
      console.error('❌ Error fetching messages:', error)
      setMessages([])
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file) => {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch('http://localhost:3000/api/upload-image', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload image')
    }

    return response.json()
  }

  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || !chatId || isThinking) return

    let imageData = null
    
    // Upload image if selected
    if (selectedImage) {
      try {
        setThinkingStatus('Uploading image...')
        imageData = await uploadImage(selectedImage)
        console.log('📸 Image uploaded:', imageData.filename)
      } catch (error) {
        console.error('Error uploading image:', error)
        alert('Failed to upload image')
        setThinkingStatus('')
        return
      }
    }

    const userMessage = {
      role: 'user',
      content: input || '(Image)',
      timestamp: new Date().toISOString()
    }
    
    if (imageData) {
      userMessage.image = imageData.url
    }

    setMessages([...messages, userMessage])
    const messageText = input || 'What do you see in this image?'
    setInput('')
    removeImage()
    setIsThinking(true)
    setStreamingMessage('')
    setThinkingStatus('')
    setToolCalling(false)
    setMemorySaved(false)

    try {
      const response = await fetch(`http://localhost:3000/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: messageText, 
          model: selectedModel, 
          personality,
          imageData 
        })
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
                // Check if memory was saved
                if (data.status.includes('Saved to memory')) {
                  setMemorySaved(true)
                  setTimeout(() => setMemorySaved(false), 3000)
                }
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
    setMemorySaved(false)

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
                if (data.status.includes('Saved to memory')) {
                  setMemorySaved(true)
                  setTimeout(() => setMemorySaved(false), 3000)
                }
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
            key={`${chatId}-msg-${index}`}
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
        {memorySaved && (
          <div className="memory-saved-banner">
            ✓ Saved to memory
          </div>
        )}
        {imagePreview && (
          <div className="image-preview-container">
            <img src={imagePreview} alt="Preview" className="image-preview" />
            <button className="remove-image-btn" onClick={removeImage}>
              <X size={16} />
            </button>
          </div>
        )}
        <div className="input-container">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            style={{ display: 'none' }}
          />
          <button
            className="image-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isThinking}
            title="Upload image"
          >
            <ImageIcon size={40} />
          </button>
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
            disabled={(!input.trim() && !selectedImage) || isThinking}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatArea
