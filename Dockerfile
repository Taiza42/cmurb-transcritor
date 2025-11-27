# Usa uma imagem Python leve compatível com ARM
FROM python:3.10-slim

# Instala o FFmpeg (Obrigatório para o Whisper funcionar) e Git
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    && rm -rf /var/lib/apt/lists/*

# Cria a pasta do app
WORKDIR /app

# Copia seus arquivos para dentro da imagem
COPY . .

# Instala as dependências (Seu requirements.txt)
# O --no-cache-dir ajuda a não estourar a memória da Oracle
RUN pip install --no-cache-dir -r requirements.txt

# Expõe a porta (Geralmente apps Python usam 5000, 8000 ou 8501)
# IMPORTANTE: Troque 5000 pela porta que seu app usa
EXPOSE 5000

# Comando para rodar o app
# IMPORTANTE: Troque "app.py" pelo nome do seu arquivo principal
CMD ["python", "main.py"]
