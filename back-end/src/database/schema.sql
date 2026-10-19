CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  removido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'caixa', 'investimento')),
  instituicao VARCHAR(120) NOT NULL DEFAULT '',
  saldo_inicial NUMERIC(14, 2) NOT NULL DEFAULT 0,
  removido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lancamentos (
  id SERIAL PRIMARY KEY,
  descricao VARCHAR(180) NOT NULL,
  valor NUMERIC(14, 2) NOT NULL CHECK (valor > 0),
  natureza VARCHAR(10) NOT NULL DEFAULT 'entrada' CHECK (natureza IN ('entrada', 'saida')),
  data DATE NOT NULL,
  conta_id INTEGER NOT NULL REFERENCES contas(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pago', 'pendente')),
  removido BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lancamentos_conta_id ON lancamentos(conta_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_data ON lancamentos(data);
