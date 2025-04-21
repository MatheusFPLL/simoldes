import pandas as pd
import psycopg2
from datetime import datetime

# Configurações do banco de dados
DB_CONFIG = {
    'host': 'localhost',
    'database': 'simoldes_estoque',
    'user': 'simoldes_user',
    'password': 'dani123'
}

def importar_planilha(caminho_arquivo):
    try:
        # Ler a planilha Excel
        df = pd.read_excel(caminho_arquivo)
        
        # Conectar ao banco de dados
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Processar cada linha da planilha
        for _, row in df.iterrows():
            # Verificar se o molde já existe
            cursor.execute("SELECT id FROM moldes WHERE codigo = %s", (row['codigo_molde'],))
            molde_id = cursor.fetchone()
            
            if not molde_id:
                # Inserir novo molde
                cursor.execute("""
                    INSERT INTO moldes (codigo, descricao, data_entrega, prioridade, status)
                    VALUES (%s, %s, %s, %s, %s) RETURNING id
                """, (
                    row['codigo_molde'],
                    row['descricao_molde'],
                    row['data_entrega'],
                    row['prioridade'],
                    'planejamento'
                ))
                molde_id = cursor.fetchone()[0]
            else:
                molde_id = molde_id[0]
            
            # Inserir/atualizar peça
            cursor.execute("""
                INSERT INTO pecas (codigo, molde_id, descricao, quantidade_necessaria)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (codigo) DO UPDATE
                SET descricao = EXCLUDED.descricao,
                    quantidade_necessaria = EXCLUDED.quantidade_necessaria
            """, (
                row['codigo_peca'],
                molde_id,
                row['descricao_peca'],
                row['quantidade']
            ))
        
        conn.commit()
        print(f"Planilha importada com sucesso! {len(df)} registros processados.")
        
    except Exception as e:
        print(f"Erro ao importar planilha: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # Caminho para a planilha Excel (ajuste conforme necessário)
    CAMINHO_PLANILHA = "/caminho/para/planilha.xlsx"
    
    if not os.path.exists(CAMINHO_PLANILHA):
        print(f"Arquivo {CAMINHO_PLANILHA} não encontrado!")
        exit(1)
    
    importar_planilha(CAMINHO_PLANILHA)