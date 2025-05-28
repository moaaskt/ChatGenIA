def identificar_intencao(pergunta):
    pergunta = pergunta.lower()
    if "curso" in pergunta:
        return "curso"
    elif "preço" in pergunta or "valor" in pergunta:
        return "preco"
    else:
        return "geral"
