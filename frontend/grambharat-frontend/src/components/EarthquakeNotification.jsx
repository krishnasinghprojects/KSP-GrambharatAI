import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import './EarthquakeNotification.css'

const EarthquakeNotification = ({ message, timestamp, onClose }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (message) {
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 500)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [message, onClose])

  if (!message) return null

  return (
    <div className={`earthquake-notification ${isVisible ? 'show' : ''}`}>
      <div className="notification-content">
        <div className="notification-icon">
          <AlertTriangle size={32} />
        </div>
        <div className="notification-body">
          <h2 className="notification-title">Earthquake Detected!</h2>
          <p className="notification-message">{message}</p>
          <p className="notification-time">{timestamp}</p>
        </div>
        <button className="close-btn" onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 500)
        }}>
          <X size={18} />
        </button>
      </div>
      <div className="notification-pulse"></div>
    </div>
  )
}

export default EarthquakeNotification
