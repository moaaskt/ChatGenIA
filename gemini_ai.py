import google.generativeai as genai
import os
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()

# Configuração com a versão correta da API
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Use o modelo mais recente
model = genai.GenerativeModel('gemini-1.5-flash')  # Modelo mais recente

def gerar_resposta_gemini(prompt):
    try:
        # Configuração de segurança (obrigatório na versão atual)
        safety_settings = [
            {
                "category": "HARM_CATEGORY_HARASSMENT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_HATE_SPEECH",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                "threshold": "BLOCK_NONE"
            },
            {
                "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                "threshold": "BLOCK_NONE"
            }
        ]
        
        resposta = model.generate_content(
            prompt,
            safety_settings=safety_settings
        )
        return resposta.text
    except Exception as e:
        print(f"Erro na Gemini AI: {str(e)}")
        return "Desculpe, não consegui processar sua pergunta no momento."