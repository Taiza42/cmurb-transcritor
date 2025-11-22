import os
import sqlite3
import whisper
import bcrypt
import uvicorn
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from docxtpl import DocxTemplate

# --- CONFIGURAÇÕES ---
app = FastAPI()

# Caminhos (Ajustados para rodar dentro de /backend)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
TEMPLATE_PATH = os.path.join(ROOT_DIR, "template_cmurb.docx")
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")
DB_PATH = os.path.join(ROOT_DIR, "usuarios_cmu.db")
UPLOAD_DIR = os.path.join(ROOT_DIR, "temp_uploads")

# Criar pasta temporária se não existir
os.makedirs(UPLOAD_DIR, exist_ok=True)

# CORS (Permitir tudo localmente)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- BANCO DE DADOS ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users 
                 (username TEXT PRIMARY KEY, password BLOB, role TEXT, name TEXT)''')
    
    # Criar ADMIN padrão se não existir
    c.execute("SELECT * FROM users WHERE username='admin'")
    if not c.fetchone():
        print("--- Criando usuário ADMIN padrão ---")
        # Senha padrão: admin123 (Alterar depois)
        pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt())
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", 
                  ('admin', pw, 'admin', 'Administrador CMUrb'))
        conn.commit()
    conn.close()

init_db()

# --- MODELO WHISPER ---
# Carrega o modelo ao iniciar (evita demora em cada requisição)
print("--- Carregando Modelo Whisper (Isso pode demorar 1 min) ---")
# 'base' é rápido. Mude para 'small' ou 'medium' se quiser mais precisão (e tiver CPU/GPU)
model = whisper.load_model("base") 
print("--- Modelo Carregado! ---")

# --- UTILITÁRIOS ---
def data_por_extenso(data_str):
    if not data_str: return ""
    try:
        meses = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 
                 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        dt = datetime.strptime(data_str, "%Y-%m-%d")
        return f"{dt.day} de {meses[dt.month]} de {dt.year}"
    except:
        return data_str

class LoginData(BaseModel):
    username: str
    password: str

# --- ROTAS DA API ---

@app.post("/api/login")
def login(data: LoginData):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT password, role, name FROM users WHERE username=?", (data.username,))
    user = c.fetchone()
    conn.close()
    
    if user and bcrypt.checkpw(data.password.encode(), user[0]):
        return {"status": "ok", "role": user[1], "name": user[2]}
    
    raise HTTPException(status_code=401, detail="Credenciais inválidas")

@app.post("/api/transcrever")
def transcrever(
    file: UploadFile,
    projeto: str = Form(""), coordenador: str = Form(""), data: str = Form(""),
    local: str = Form(""), formato: str = Form(""), entrevistadores: str = Form(""),
    outros: str = Form(""), duracao: str = Form(""), docs_coletados: str = Form(""),
    docs_reproduzidos: str = Form(""), obs: str = Form(""), entrevistado: str = Form(""),
    resumo: str = Form(""), tags: str = Form("")
):
    print(f"Iniciando transcrição para: {entrevistado}")
    
    # 1. Salvar áudio temporário
    temp_filename = f"temp_{datetime.now().timestamp()}.{file.filename.split('.')[-1]}"
    temp_path = os.path.join(UPLOAD_DIR, temp_filename)
    
    with open(temp_path, "wb") as f:
        f.write(file.file.read())

    try:
        # 2. Executar Whisper
        # prompt ajuda a IA com contexto e palavras difíceis
        prompt_ia = f"Entrevista de história oral. Tema: {resumo}. Palavras-chave: {tags}."
        result = model.transcribe(temp_path, language="pt", initial_prompt=prompt_ia)
        
        # 3. Formatar Texto com Timestamps
        transcricao_completa = []
        for s in result['segments']:
            start = str(timedelta(seconds=int(s['start'])))
            text = s['text'].strip()
            transcricao_completa.append(f"[{start}] {text}")
        
        texto_final = "\n\n".join(transcricao_completa)

        # 4. Preencher Template DOCX
        if not os.path.exists(TEMPLATE_PATH):
            raise HTTPException(status_code=500, detail="Template DOCX não encontrado no servidor.")

        doc = DocxTemplate(TEMPLATE_PATH)
        
        contexto = {
            'projeto': projeto,
            'coordenador': coordenador,
            'data': data_por_extenso(data), # Data formatada (extenso)
            'data_raw': data,               # Data original (se precisar)
            'local': local,
            'formato': formato,
            'entrevistadores': entrevistadores,
            'outros': outros,
            'duracao': duracao,
            'docs_coletados': docs_coletados,
            'docs_reproduzidos': docs_reproduzidos,
            'obs': obs,
            'entrevistado': entrevistado,
            'resumo': resumo,
            'tags': tags,
            # Se o template tiver {{ conteudo_transcricao }}, usa o texto formatado.
            # Se tiver variáveis separadas, o loop deve ser feito no Jinja do docx.
            # Vou mandar o texto formatado por segurança:
            'conteudo_transcricao': texto_final 
        }

        doc.render(contexto)
        
        output_filename = f"Transcricao_{entrevistado.replace(' ', '_')}.docx"
        output_path = os.path.join(UPLOAD_DIR, output_filename)
        doc.save(output_path)
        
        return FileResponse(output_path, filename=output_filename, media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')

    except Exception as e:
        print(f"ERRO CRÍTICO: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Limpeza do áudio
        if os.path.exists(temp_path):
            os.remove(temp_path)

# --- SERVIR FRONTEND REACT ---
# Monta a pasta 'dist' do React na raiz. 
# Qualquer rota não capturada acima vai para o React (SPA).
app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")

if __name__ == "__main__":
    # Roda na porta 8000
    uvicorn.run(app, host="0.0.0.0", port=8501)

