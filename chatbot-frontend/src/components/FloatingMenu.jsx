const FloatingMenu = ({ onSelectOption }) => {
  const menuOptions = [
    { command: '/cursos', description: 'Ver todos os cursos disponíveis' },
    { command: '/precos', description: 'Informações sobre preços' },
    { command: '/suporte', description: 'Falar com suporte' },
    { command: '/sair', description: 'Encerrar conversa' }
  ]

  return (
    <div className="absolute bottom-16 right-4 bg-white shadow-lg rounded-lg p-2 w-64 z-10 border border-gray-200">
      <h3 className="font-semibold p-2 border-b border-gray-200">Opções Rápidas</h3>
      <ul>
        {menuOptions.map((option, index) => (
          <li key={index}>
            <button
              onClick={() => onSelectOption(option.command)}
              className="w-full text-left p-2 hover:bg-gray-100 rounded transition-colors"
            >
              <span className="font-medium text-indigo-600">{option.command}</span>
              <p className="text-sm text-gray-600">{option.description}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FloatingMenu