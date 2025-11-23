import os
import sqlite3
import whisper
import bcrypt
import uvicorn
import base64
from datetime import datetime, timedelta
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from docxtpl import DocxTemplate

app = FastAPI()

# --- CONFIGURAÇÕES ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)
TEMPLATE_PATH = os.path.join(ROOT_DIR, "template_cmurb.docx")
FRONTEND_DIST = os.path.join(ROOT_DIR, "frontend", "dist")
DB_PATH = os.path.join(ROOT_DIR, "usuarios_cmu.db")
UPLOAD_DIR = os.path.join(ROOT_DIR, "temp_uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

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
        pw = bcrypt.hashpw(b"admin123", bcrypt.gensalt())
        c.execute("INSERT INTO users VALUES (?, ?, ?, ?)", 
                  ('admin', pw, 'admin', 'Administrador CMUrb'))
        conn.commit()
    conn.close()

init_db()

# --- MODELO WHISPER ---
print("--- Carregando Modelo Whisper ---")
model = whisper.load_model("base") 
print("--- Modelo Carregado! ---")

# --- UTILITÁRIOS ---
def formatar_data_extenso(data_str):
    if not data_str: return ""
    try:
        meses = {1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril", 5: "maio", 6: "junho", 
                 7: "julho", 8: "agosto", 9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"}
        dt = datetime.strptime(data_str, "%Y-%m-%d")
        return f"{dt.day} de {meses[dt.month]} de {dt.year}"
    except:
        return data_str

def formatar_data_curta(data_str):
    if not data_str: return ""
    try:
        dt = datetime.strptime(data_str, "%Y-%m-%d")
        return dt.strftime("%d/%m/%Y")
    except:
        return data_str

def gerar_iniciais(nome_completo):
    if not nome_completo: return ""
    partes = nome_completo.split()
    iniciais = [p[0].upper() for p in partes if len(p) > 1 or p.lower() not in ['e', 'da', 'do', 'de']]
    return ".".join(iniciais)

def agrupar_texto_2min(segments):
    texto_formatado = ""
    intervalo = 120 
    tempo_limite = intervalo
    bloco_atual = []

    for s in segments:
        bloco_atual.append(s['text'].strip())
        if s['end'] >= tempo_limite:
            minutos = int(tempo_limite / 60)
            tempo_label = f"{minutos-2:02d}:00 - {minutos:02d}:00" if minutos >=2 else "00:00 - 02:00"
            texto_formatado += f"[{tempo_label}] {' '.join(bloco_atual)}\n\n"
            bloco_atual = []
            tempo_limite += intervalo
            while s['end'] >= tempo_limite: tempo_limite += intervalo

    if bloco_atual: texto_formatado += f" ".join(bloco_atual)
    return texto_formatado

# --- SCHEMAS PYDANTIC ---
class LoginData(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    name: str
    role: str

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

# --- NOVAS ROTAS DE GESTÃO DE USUÁRIOS ---

@app.get("/api/users")
def list_users():
    """Lista todos os usuários (sem mostrar a senha)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT username, name, role FROM users")
    users = [dict(row) for row in c.fetchall()]
    conn.close()
    return users

@app.post("/api/users")
def create_user(user: UserCreate):
    """Cria novo usuário no banco"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Verifica se já existe
    c.execute("SELECT username FROM users WHERE username=?", (user.username,))
    if c.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Usuário já existe")
    
    # Hash da senha
    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())
    
    c.execute("INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)",
              (user.username, hashed_pw, user.role, user.name))
    conn.commit()
    conn.close()
    return {"status": "created", "username": user.username}

@app.delete("/api/users/{username}")
def delete_user(username: str):
    """Remove usuário do banco"""
    if username == "admin":
        raise HTTPException(status_code=400, detail="Não é possível excluir o admin principal")
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("DELETE FROM users WHERE username=?", (username,))
    conn.commit()
    conn.close()
    return {"status": "deleted"}

# ----------------------------------------

@app.post("/api/transcrever")
def transcrever(
    file: UploadFile,
    projeto: str = Form(""), coordenador: str = Form(""), data: str = Form(""),
    local: str = Form(""), formato: str = Form(""), entrevistadores: str = Form(""),
    outros: str = Form(""), duracao: str = Form(""), docs_coletados: str = Form(""),
    docs_reproduzidos: str = Form(""), obs: str = Form(""), entrevistado: str = Form(""),
    resumo: str = Form(""), tags: str = Form("")
):
    temp_path = os.path.join(UPLOAD_DIR, f"temp_{datetime.now().timestamp()}.tmp")
    with open(temp_path, "wb") as f:
        f.write(file.file.read())

    try:
        # Whisper
        result = model.transcribe(temp_path, language="pt", initial_prompt=f"Entrevista sobre {resumo}")
        texto_final = agrupar_texto_2min(result['segments'])
        texto_preview = result['text']

        # DOCX
        doc = DocxTemplate(TEMPLATE_PATH)
        contexto = {
            'projeto': projeto,
            'coordenador': coordenador,
            'data': formatar_data_curta(data),
            'data_extenso': formatar_data_extenso(data),
            'local': local,
            'formato': formato,
            'entrevistadores': entrevistadores,
            'iniciais_entrevistador': gerar_iniciais(entrevistadores),
            'entrevistado': entrevistado,
            'iniciais_entrevistado': gerar_iniciais(entrevistado),
            'outros': outros,
            'duracao': duracao,
            'docs_coletados': docs_coletados,
            'docs_reproduzidos': docs_reproduzidos,
            'obs': obs,
            'resumo': resumo,
            'tags': tags,
            'conteudo_transcricao': texto_final
        }

        doc.render(contexto)
        output_filename = f"Transcricao_{entrevistado.replace(' ', '_')}.docx"
        output_path = os.path.join(UPLOAD_DIR, output_filename)
        doc.save(output_path)
        
        # Base64 para retorno
        with open(output_path, "rb") as doc_file:
            encoded_string = base64.b64encode(doc_file.read()).decode('utf-8')

        return JSONResponse({
            "preview_text": texto_preview,
            "file_name": output_filename,
            "file_base64": encoded_string
        })

    except Exception as e:
        print(f"ERRO: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8501)

