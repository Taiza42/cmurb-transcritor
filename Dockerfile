# Usa Python 3.10 (Versão estável pro Whisper)
FROM python:3.10-slim

# Instala FFmpeg (Obrigatório pro Whisper) e Git
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Cria a pasta do app dentro do container
WORKDIR /app

# Copia seus arquivos para lá
COPY . .

# Instala as bibliotecas do requirements
RUN pip install --no-cache-dir -r requirements.txt

# Expõe a porta 8000 (Padrão do FastAPI)
EXPOSE 8000

# COMANDO DE INICIALIZAÇÃO
# Atenção: Ajuste "app:app" conforme o nome do seu arquivo (leia abaixo)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
