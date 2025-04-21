import os
import time
import psycopg2
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Adicione no início do arquivo
import requests

# Configuração do backend
BACKEND_URL = "http://localhost:3000/api/arquivos"
HEADERS = {"Content-Type": "application/json"}

# Modifique a classe PastaHandler
class PastaHandler(FileSystemEventHandler):
    def processar_arquivo(self, caminho_arquivo):
        nome_arquivo = os.path.basename(caminho_arquivo)
        partes = nome_arquivo.split('_')
        
        if len(partes) >= 2 and partes[0].startswith('molde'):
            codigo_molde = partes[0][5:]
            codigo_peca = partes[1]
            extensao = os.path.splitext(nome_arquivo)[1].lower()
            
            # Determina o tipo de arquivo
            tipo = 'cad' if extensao in ['.stp', '.step', '.igs', '.iges'] else (
                   'cam' if extensao in ['.nc', '.cnc'] else None)
            
            if tipo:
                dados = {
                    'molde': codigo_molde,
                    'peca': codigo_peca,
                    'tipo': tipo,
                    'caminho': caminho_arquivo,
                    'nome_arquivo': nome_arquivo,
                    'data_modificacao': os.path.getmtime(caminho_arquivo)
                }
                
                try:
                    # Envia para o backend
                    response = requests.post(BACKEND_URL, json=dados, headers=HEADERS)
                    
                    if response.status_code == 200:
                        print(f"Arquivo {nome_arquivo} processado e notificação enviada")
                    else:
                        print(f"Erro ao enviar notificação: {response.text}")
                
                except Exception as e:
                    print(f"Erro na comunicação com o backend: {e}")

# Configurações do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'simoldes_estoque',
    'user': 'simoldes_user',
    'password': 'dani123'
}

class PastaHandler(FileSystemEventHandler):
    def on_created(self, event):
        if not event.is_directory:
            self.processar_arquivo(event.src_path)
    
    def on_modified(self, event):
        if not event.is_directory:
            self.processar_arquivo(event.src_path)
    
    def processar_arquivo(self, caminho_arquivo):
        nome_arquivo = os.path.basename(caminho_arquivo)
        
        # Extrai informações do nome do arquivo (ex: molde1658_200P1_rev01.stp)
        partes = nome_arquivo.split('_')
        
        if len(partes) >= 2 and partes[0].startswith('molde'):
            codigo_molde = partes[0][5:]  # Remove 'molde' do início
            codigo_peca = partes[1]
            
            # Determina se é CAD ou CAM pela extensão
            extensao = os.path.splitext(nome_arquivo)[1].lower()
            
            try:
                conn = psycopg2.connect(**DB_CONFIG)
                cursor = conn.cursor()
                
                if extensao in ['.stp', '.step', '.igs', '.iges']:  # Arquivos CAD
                    cursor.execute("""
                        UPDATE pecas 
                        SET status_cad = TRUE 
                        WHERE codigo LIKE %s AND molde_id IN (
                            SELECT id FROM moldes WHERE codigo = %s
                        )
                    """, (f"%{codigo_peca}%", codigo_molde))
                
                elif extensao in ['.nc', '.cnc']:  # Arquivos CAM
                    cursor.execute("""
                        UPDATE pecas 
                        SET status_cam = TRUE 
                        WHERE codigo LIKE %s AND molde_id IN (
                            SELECT id FROM moldes WHERE codigo = %s
                        )
                    """, (f"%{codigo_peca}%", codigo_molde))
                
                conn.commit()
                print(f"Arquivo {nome_arquivo} processado - CAD/CAM atualizado")
                
            except Exception as e:
                print(f"Erro ao processar arquivo {nome_arquivo}: {e}")
            finally:
                if conn:
                    conn.close()

def monitorar_pasta(caminho_pasta):
    event_handler = PastaHandler()
    observer = Observer()
    observer.schedule(event_handler, caminho_pasta, recursive=True)
    observer.start()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

if __name__ == "__main__":
    # Caminho da pasta que será monitorada (ajuste conforme necessário)
    PASTA_MODELOS = "/caminho/para/pasta/modelos"
    
    if not os.path.exists(PASTA_MODELOS):
        print(f"Pasta {PASTA_MODELOS} não encontrada!")
        exit(1)
    
    print(f"Iniciando monitoramento da pasta {PASTA_MODELOS}...")
    monitorar_pasta(PASTA_MODELOS)