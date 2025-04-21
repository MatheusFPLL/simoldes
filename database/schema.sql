-- Tabela de moldes
CREATE TABLE moldes (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    descricao TEXT,
    data_entrega DATE,
    prioridade INTEGER,
    status VARCHAR(20) CHECK (status IN ('planejamento', 'producao', 'montagem', 'finalizado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de peças
CREATE TABLE pecas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    molde_id INTEGER REFERENCES moldes(id),
    descricao TEXT,
    quantidade_necessaria INTEGER,
    status_cad BOOLEAN DEFAULT FALSE,
    status_cam BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de estoque de aço
CREATE TABLE estoque_aco (
    id SERIAL PRIMARY KEY,
    tipo_aco VARCHAR(50) NOT NULL,
    quantidade_disponivel FLOAT,
    quantidade_reservada FLOAT,
    unidade_medida VARCHAR(10) DEFAULT 'kg'
);

-- Tabela de processos
CREATE TABLE processos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    tempo_estimado_minutos INTEGER
);

-- Tabela de peças_processos (relacionamento muitos-para-muitos)
CREATE TABLE pecas_processos (
    peca_id INTEGER REFERENCES pecas(id),
    processo_id INTEGER REFERENCES processos(id),
    ordem INTEGER,
    status VARCHAR(20) DEFAULT 'pendente',
    PRIMARY KEY (peca_id, processo_id)
);

-- Tabela de ordens de compra
CREATE TABLE ordens_compra (
    id SERIAL PRIMARY KEY,
    tipo_aco VARCHAR(50) NOT NULL,
    quantidade FLOAT,
    data_prevista DATE,
    status VARCHAR(20) DEFAULT 'pendente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de checklists
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    peca_id INTEGER REFERENCES pecas(id),
    processo_id INTEGER REFERENCES processos(id),
    item VARCHAR(200) NOT NULL,
    concluido BOOLEAN DEFAULT FALSE,
    responsavel VARCHAR(100),
    data_conclusao TIMESTAMP,
    observacoes TEXT
);

-- Tabela de máquinas
CREATE TABLE maquinas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em_uso', 'manutencao')),
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de utilização de máquinas
CREATE TABLE uso_maquinas (
    id SERIAL PRIMARY KEY,
    maquina_id INTEGER REFERENCES maquinas(id),
    peca_id INTEGER REFERENCES pecas(id),
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    operador VARCHAR(100),
    status VARCHAR(20) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluido', 'pausado'))
);

-- Tabela de logs
CREATE TABLE logs (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    dados JSONB,
    usuario VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);