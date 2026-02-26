import { User, Bot, Copy, RotateCcw, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './Message.css'

const Message = ({ message, onRegenerate, isLastAI, messageIndex, chatId }) => {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [activeIdx, setActiveIdx] = useState(message.activeIndex || 0)
  const [displayContent, setDisplayContent] = useState(message.content)
  const [isSliding, setIsSliding] = useState(false)

  const alternatives = message.alternatives || null
  const totalAlts = alternatives ? alternatives.length : 0

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const switchAlternative = async (newIndex) => {
    if (newIndex < 0 || newIndex >= totalAlts || newIndex === activeIdx) return

    setIsSliding(true)
    setTimeout(async () => {
      setActiveIdx(newIndex)
      setDisplayContent(alternatives[newIndex])
      setIsSliding(false)

      // Persist to server
      try {
        await fetch(`http://localhost:3000/api/chats/${chatId}/messages/${messageIndex}/switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ activeIndex: newIndex })
        })
      } catch (e) {
        console.error('Failed to persist alternative switch:', e)
      }
    }, 200)
  }

  return (
    <div className={`message ${isUser ? 'user-message' : 'ai-message'}`}>
      <div className="message-avatar">
        {isUser ? <User size={25} /> : <Bot size={25} />}
      </div>
      <div className="message-content">
        {message.image && (
          <div className="message-image-container">
            <img 
              src={`http://localhost:3000${message.image}`} 
              alt="Uploaded" 
              className="message-image"
            />
          </div>
        )}
        <div className={`message-text ${isSliding ? 'alt-sliding' : ''}`}>
          {isUser ? (
            <p>{displayContent}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {displayContent}
            </ReactMarkdown>
          )}
        </div>
        <div className="message-footer">
          <div className="message-time">
            {new Date(message.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Pagination for alternatives */}
          {!isUser && totalAlts > 1 && (
            <div className="alt-pagination">
              <button
                className="alt-nav-btn"
                onClick={() => switchAlternative(activeIdx - 1)}
                disabled={activeIdx === 0}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="alt-page">{activeIdx + 1}/{totalAlts}</span>
              <button
                className="alt-nav-btn"
                onClick={() => switchAlternative(activeIdx + 1)}
                disabled={activeIdx === totalAlts - 1}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="message-actions">
            <button
              className="action-btn copy-btn"
              onClick={handleCopy}
              title="Copy message"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            {!isUser && isLastAI && onRegenerate && (
              <button
                className="action-btn regenerate-btn"
                onClick={onRegenerate}
                title="Regenerate response"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message
