const Message = ({ text, sender }) => {
  return (
    <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 ${sender === 'user' 
          ? 'bg-indigo-500 text-white' 
          : 'bg-white text-gray-800 border border-gray-200'}`}
      >
        {text.split('\n').map((paragraph, i) => (
          <p key={i} className="my-1">{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

export default Message