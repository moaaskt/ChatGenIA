from flask import Flask, request, jsonify
from flask_cors import CORS
from crawler import extrair_conteudo_sobre, extrair_duvidas_frequentes, extrair_cursos, extrair_precos
from gemini_ai import gerar_resposta_gemini
import traceback
from datetime import datetime

app = Flask(__name__)

# Configuração robusta de CORS
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Middleware para log de requisições
@app.before_request
def log_request():
    if request.path != '/favicon.ico':
        app.logger.info(f"[{datetime.now()}] {request.method} {request.path}")

# Carrega dados uma vez no início com tratamento de erro
try:
    dados_site = {
        **extrair_conteudo_sobre(),
        "duvidas": extrair_duvidas_frequentes(),
        **extrair_cursos(),
        **extrair_precos()
    }
    app.logger.info("Dados iniciais carregados com sucesso")
except Exception as e:
    app.logger.error(f"Erro ao carregar dados iniciais: {str(e)}")
    dados_site = {
        "sobre": "Informações não disponíveis no momento",
        "duvidas": {},
        "cursos": [],
        "precos": "Consulte nossos planos no site",
        "cidades": "Lista não disponível"
    }

@app.route("/atualizar-dados", methods=["GET", "OPTIONS"])
def atualizar_dados():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        global dados_site
        dados_site = {
            **extrair_conteudo_sobre(),
            "duvidas": extrair_duvidas_frequentes(),
            **extrair_cursos(),
            **extrair_precos()
        }
        app.logger.info("Dados atualizados com sucesso")
        return jsonify({
            "status": "success",
            "message": "Dados atualizados",
            "dados": dados_site
        }), 200
    except Exception as e:
        app.logger.error(f"Erro ao atualizar dados: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "Falha ao atualizar dados"
        }), 500

@app.route("/chat", methods=["POST", "OPTIONS"])
def responder():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        dados = request.get_json()
        if not dados or "message" not in dados:
            return jsonify({
                "error": "Formato inválido",
                "message": "O campo 'message' é obrigatório"
            }), 400

        pergunta = dados.get("message", "").strip().lower()
        app.logger.info(f"Pergunta recebida: {pergunta}")

        # Comandos especiais
        if pergunta in ["/sair", "encerrar chat", "sair"]:
            return jsonify({
                "response": "Chat encerrado. Até mais!",
                "end_chat": True
            })

        if pergunta in ["/menu", "mostrar menu", "menu"]:
            return jsonify({
                "response": "Selecione uma opção:",
                "menu_options": [
                    {"label": "Cursos disponíveis", "command": "cursos"},
                    {"label": "Preços e planos", "command": "preços"},
                    {"label": "Sobre a plataforma", "command": "sobre"},
                    {"label": "Cidades participantes", "command": "cidades"},
                    {"label": "Dúvidas frequentes", "command": "dúvidas"},
                    {"label": "Atualizar dados", "command": "/atualizar"},
                    {"label": "Encerrar chat", "command": "/sair"}
                ]
            })

        if pergunta in ["/atualizar", "atualizar dados"]:
            return atualizar_dados()

        # Respostas baseadas nos comandos do menu
        if pergunta in ["cursos", "curso"]:
            return jsonify({
                "response": formatar_cursos(dados_site.get("cursos", [])),
                "source": "cursos"
            })

        if pergunta in ["preços", "preço", "valores", "valor"]:
            return jsonify({
                "response": dados_site.get("precos", "Consulte nossos planos no site"),
                "source": "precos"
            })

        if pergunta == "sobre":
            return jsonify({
                "response": dados_site.get("sobre", "Informações não disponíveis"),
                "source": "sobre"
            })

        if pergunta in ["cidades", "cidade"]:
            return jsonify({
                "response": f"📍 Cidades participantes do programa:\n\n{dados_site.get('cidades', 'Lista não disponível')}",
                "source": "cidades"
            })

        if pergunta in ["duvidas", "duvidas"]:
            return jsonify({
                "response": formatar_duvidas(dados_site.get("duvidas", [])),
                "source": "duvidas"
            })

        # Respostas baseadas em palavras-chave
        if "curso" in pergunta or "aprender" in pergunta:
            return jsonify({
                "response": formatar_cursos(dados_site.get("cursos", [])),
                "source": "cursos"
            })

        if "preço" in pergunta or "valor" in pergunta or "custo" in pergunta:
            return jsonify({
                "response": dados_site.get("precos", "Consulte nossos planos no site"),
                "source": "precos"
            })

        if "sobre" in pergunta:
            return jsonify({
                "response": dados_site.get("sobre", "Informações não disponíveis"),
                "source": "sobre"
            })

        if "dúvida" in pergunta or "pergunta" in pergunta:
            return jsonify({
                "response": formatar_duvidas(dados_site.get("duvidas", []), pergunta),
                "source": "duvidas"
            })

        if "cidade" in pergunta or "município" in pergunta or "local" in pergunta or "onde" in pergunta:
            return jsonify({
                "response": f"📍 Cidades participantes do programa:\n\n{dados_site.get('cidades', 'Lista não disponível')}",
                "source": "cidades"
            })

        # Gemini AI para perguntas livres
        resposta_gemini = gerar_resposta_gemini(
            f"Responda como assistente do Jovem Programador sobre: {pergunta}"
        )
        
        if resposta_gemini:
            return jsonify({
                "response": resposta_gemini,
                "source": "gemini"
            })
        
        return jsonify({
            "response": "Não entendi sua pergunta. Digite 'menu' para ver as opções disponíveis.",
            "suggestions": ["menu", "cursos", "preços", "dúvidas"]
        })

    except Exception as e:
        app.logger.error(f"Erro no endpoint /chat: {str(e)}")
        app.logger.error(traceback.format_exc())
        return jsonify({
            "error": "Erro interno no servidor",
            "message": "Ocorreu um erro ao processar sua solicitação"
        }), 500

def formatar_cursos(cursos):
    if not cursos:
        return "Nenhum curso encontrado."
    return "🎓 Cursos disponíveis:\n\n- " + "\n- ".join(cursos)

def formatar_duvidas(duvidas, pergunta=None):
    if not duvidas:
        return "Nenhuma dúvida frequente cadastrada no momento."
    
    duvidas_prioritarias = [
        
    ]
    
    # Tentar encontrar resposta exata
    if pergunta:
        pergunta = pergunta.lower()
        for titulo, resposta in duvidas.items():
            titulo_lower = titulo.lower().rstrip('?')
            if any(palavra in titulo_lower for palavra in pergunta.split()):
                return f"❓ {titulo}\n💡 {resposta}"
    
    # Mostrar dúvidas prioritárias + outras até 3 itens
    resposta = ""
    contador = 0
    mostradas = set()
    
    # Primeiro adiciona as prioritárias
    for titulo in duvidas_prioritarias:
        if titulo in duvidas and contador < 3:
            resposta += f"❓ {titulo}\n💡 {duvidas[titulo]}\n\n"
            mostradas.add(titulo)
            contador += 1
    
    # Depois completa com outras até 3 itens
    for titulo, conteudo in duvidas.items():
        if titulo not in mostradas and contador < 3:
            resposta += f"❓ {titulo}\n💡 {conteudo}\n\n"
            contador += 1
    
    # Adiciona instrução para perguntas específicas
    if len(duvidas) > 3:
        resposta += "ℹ️ Existem mais dúvidas disponíveis. Você pode perguntar sobre:\n" \
                   "- Inscrição\n- Custo do programa\n- Requisitos\n- Local das aulas\n" \
                   "- Datas importantes\n- Documentação necessária"
    
    return resposta.strip()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)