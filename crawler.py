import requests
from bs4 import BeautifulSoup
import json

def extrair_conteudo_sobre():
    """Extrai informações da página 'Sobre' do site"""
    url = "https://www.jovemprogramador.com.br/sobre.php"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Encontra a seção principal
        secao_sobre = soup.find('div', class_='fh5co-heading')
        
        if not secao_sobre:
            return {"sobre": "Informações não disponíveis."}

        # Extrai parágrafos relevantes
        textos = []
        for p in secao_sobre.find_all('p'):
            texto = p.get_text(strip=True)
            if texto and len(texto) > 20:  # Filtra textos curtos
                textos.append(texto)
        
        # Remove duplicados mantendo a ordem
        textos_unicos = []
        visto = set()
        for texto in textos:
            if texto not in visto:
                visto.add(texto)
                textos_unicos.append(texto)
        
        # Extrai cidades
        cidades = ""
        for p in soup.find_all('p'):
            if p.get_text(strip=True).startswith("Para a edição de"):
                cidades_paragraph = p.find_next_sibling('p')
                if cidades_paragraph and cidades_paragraph.find('strong'):
                    cidades = cidades_paragraph.find('strong').get_text(strip=True)
        
        return {
            "sobre": "\n\n".join(textos_unicos[:3]),  # Limita a 3 parágrafos
            "cidades": cidades or "Lista de cidades não encontrada"
        }
        
    except Exception as e:
        print(f"Erro ao raspar página Sobre: {e}")
        return {
            "sobre": "Erro ao carregar informações sobre a plataforma.",
            "cidades": "Erro ao carregar lista de cidades."
        }

def extrair_duvidas_frequentes():
    try:
        url = "https://www.jovemprogramador.com.br/duvidas.php"
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        duvidas = {}
        
        accordion = soup.find('div', class_='accordion')
        if not accordion:
            return {"duvidas": {}}
            
        itens_duvida = accordion.find_all('div', recursive=False)
        
        for item in itens_duvida:
            pergunta = item.find('h4').get_text(strip=True) if item.find('h4') else ""
            resposta_div = item.find('div', class_='collapse')
            resposta = resposta_div.find('p').get_text(strip=True) if resposta_div and resposta_div.find('p') else ""
            
            if pergunta and resposta:
                duvidas[pergunta.strip()] = resposta.strip()
        
        return {"duvidas": duvidas}
    except Exception as e:
        print(f"Erro ao raspar 'duvidas': {e}")
        return {"duvidas": {}}

        

def extrair_cursos():
    """Extrai informações sobre cursos (simplificado)"""
    return {"cursos": ["Python", "JavaScript", "Web Development"]}

def extrair_precos():
    """Extrai informações sobre preços (simplificado)"""
    return {"precos": "Consulte nossos planos no site"}

def salvar_dados():
    """Função opcional para salvar dados em JSON"""
    dados = {
        **extrair_conteudo_sobre(),
        "duvidas": extrair_duvidas_frequentes(),
        **extrair_cursos(),
        **extrair_precos()
    }
    
    with open('dados.json', 'w', encoding='utf-8') as f:
        json.dump(dados, f, ensure_ascii=False, indent=2)
    print("✅ Dados salvos em 'dados.json'")

if __name__ == "__main__":
    salvar_dados()