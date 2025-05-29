import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMenuOptions, setShowMenuOptions] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Detecta modo escuro do sistema
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
    }
  }, [])

  // Contador de mensagens não lidas
  useEffect(() => {
    if (!isChatOpen && messages.length > 0) {
      // Conta apenas mensagens do bot recebidas desde a última vez que o chat foi fechado
      const lastReadIndex = messages.length - unreadCount - 1
      const newBotMessages = messages.slice(lastReadIndex + 1).filter(msg => msg.sender === 'bot').length
      
      if (newBotMessages > 0) {
        setUnreadCount(prev => prev + newBotMessages)
      }
    }
  }, [messages])

  const resetUnreadCount = () => {
    setUnreadCount(0)
  }

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options)
        if (!response.ok) throw new Error('Erro na resposta do servidor')
        return response
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    const userMessage = { text: inputValue, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setShowMenuOptions(false)

    try {
      const response = await fetchWithRetry('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: inputValue }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.message || 'Erro no servidor')
      }

      if (data.menu_options) {
        setShowMenuOptions(true)
      }

      setMessages(prev => [...prev, {
        text: data.response,
        sender: 'bot',
        menuOptions: data.menu_options,
        source: data.source
      }])
    } catch (error) {
      console.error('Erro:', error)
      setMessages(prev => [...prev, {
        text: error.message || 'Desculpe, ocorreu um erro ao conectar com o servidor.',
        sender: 'bot',
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMenuSelect = async (command) => {
    setIsLoading(true)
    setShowMenuOptions(false)
    const userMessage = { text: command, sender: 'user' }
    setMessages(prev => [...prev, userMessage])

    try {
      const response = await fetchWithRetry('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: command }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.message || 'Erro no servidor')
      }

      setMessages(prev => [...prev, {
        text: data.response,
        sender: 'bot',
        source: data.source
      }])
    } catch (error) {
      console.error('Erro:', error)
      setMessages(prev => [...prev, {
        text: error.message || 'Desculpe, ocorreu um erro ao processar sua seleção.',
        sender: 'bot',
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const showMenu = async () => {
    setIsLoading(true)

    try {
      const response = await fetchWithRetry('http://localhost:5000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: "menu" }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.message || 'Erro ao carregar menu')
      }

      setMessages(prev => [...prev, {
        text: data.response,
        sender: 'bot',
        menuOptions: data.menu_options
      }])

      setShowMenuOptions(true)
    } catch (error) {
      console.error('Erro:', error)
      setMessages(prev => [...prev, {
        text: error.message || 'Não foi possível carregar o menu. Por favor, tente novamente.',
        sender: 'bot',
        isError: true
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setShowMenuOptions(false)
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  const toggleChat = () => {
    setIsChatOpen(prev => {
      if (!prev) {
        resetUnreadCount()
      }
      return !prev
    })
  }

  return (
    <div className={`chatbot-wrapper ${darkMode ? 'dark' : ''}`}>
      {/* Botão flutuante com efeito de pulso - só aparece quando chat fechado */}
      {!isChatOpen && (
        <button
          className="chat-toggle-button pulse"
          onClick={toggleChat}
          aria-label="Abrir Chat"
        >
          <div className="chat-icon-wrapper">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Janela do chat */}
      <div className={`chat-window ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-container">
          <header className="chat-header">
            <div className="header-left">
              <div className="avatar bot-avatar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 00-3 3v1a3 3 0 006 0V5a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 23h8" />
                </svg>
              </div>
              <div className="header-text">
                <h1>ChatBot</h1>
                <p>Assistente do Jovem Programador</p>
              </div>
            </div>
            <div className="header-right">
              <button onClick={toggleDarkMode} className="theme-toggle" title="Alternar tema">
                {darkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                  </svg>
                )}
              </button>
              <button onClick={toggleChat} className="close-chat" title="Fechar chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </header>

          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>Bem-vindo ao ChatBot!</p>
                <p>Comece digitando uma mensagem ou</p>
                <button onClick={showMenu} className="menu-button">Mostrar Menu</button>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`message-wrapper ${msg.sender}-wrapper`}>
                  <div className={`avatar ${msg.sender}-avatar`}>
                    {msg.sender === 'user' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2a3 3 0 00-3 3v1a3 3 0 006 0V5a3 3 0 00-3-3z" />
                        <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v3M8 23h8" />
                      </svg>
                    )}
                  </div>
                  <div className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'} ${msg.isError ? 'error-message' : ''}`}>
                    {msg.text}
                    {msg.source && !msg.isError && (
                      <span className="message-source">{`Fonte: ${msg.source}`}</span>
                    )}
                  </div>
                  {msg.menuOptions && (
                    <div className="menu-container">
                      <div className="menu-grid">
                        {msg.menuOptions.map((option, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleMenuSelect(option.command)}
                            className="menu-button"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="loading-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="input-container">
            <form onSubmit={handleSendMessage} className="input-form">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="message-input"
              />
              <button
                type="submit"
                className="send-button"
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </button>
            </form>

            <div className="quick-actions">
              <button type="button" onClick={showMenu} className="quick-action" disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button type="button" onClick={clearChat} className="quick-action" disabled={isLoading}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App