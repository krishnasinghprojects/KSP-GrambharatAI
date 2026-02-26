import { Bot, Loader2, Wrench } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import './ThinkingAnimation.css'

const ThinkingAnimation = ({ streamingText, status, toolCalling }) => {
  return (
    <div className="thinking-container">
      <div className="thinking-avatar">
        <Bot size={20} />
      </div>
      <div className="thinking-content">
        {streamingText ? (
          <div className="streaming-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {streamingText}
            </ReactMarkdown>
            <span className="cursor-blink">▋</span>
          </div>
        ) : (
          <>
            {toolCalling && (
              <div className="tool-calling-indicator">
                <Wrench size={16} className="tool-icon" />
                <span className="tool-calling-text">Running loan eligibility check...</span>
              </div>
            )}
            <div className="thinking-indicator">
              <Loader2 size={18} className="spinner" />
              <div>
                <span className="thinking-text">
                  {toolCalling ? 'Processing...' : 'Thinking...'}
                </span>
                {status && <div className="status-text">{status}</div>}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default ThinkingAnimation
