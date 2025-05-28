import { useState, useRef, useEffect } from 'react'
import './App.css'

function App() {
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showMenuOptions, setShowMenuOptions] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1 className="text-xl font-bold">ChatBot</h1>
        <p className="text-sm">Assistente do Jovem Programador</p>
      </header>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Bem-vindo ao ChatBot!</p>
            <p>Comece digitando uma mensagem ou</p>
            <button 
              onClick={showMenu}
              className="menu-button"
            >
              Mostrar Menu de Opções
            </button>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index}>
              <div className={`message ${msg.sender === 'user' ? 'user-message' : 'bot-message'} ${msg.isError ? 'error-message' : ''}`}>
                {msg.text}
                {msg.source && !msg.isError && (
                  <span className="message-source">{`Fonte: ${msg.source}`}</span>
                )}
              </div>
              {msg.menuOptions && (
                <div className="menu-container">
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
            Enviar
          </button>
        </form>
        <div className="quick-actions">
          <button 
            type="button" 
            onClick={showMenu}
            className="quick-action"
            disabled={isLoading}
          >
            Menu
          </button>
          <button 
            type="button" 
            onClick={clearChat}
            className="quick-action"
            disabled={isLoading}
          >
            Limpar
          </button>
        </div>
      </div>
    </div>
  )
}

export default App