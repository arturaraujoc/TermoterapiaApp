from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import pymysql

app = FastAPI(title="Termoterapia API", version="1.0")

# Configuração de CORS (Essencial para o front-end conversar com o backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite qualquer origem (ideal para desenvolvimento)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuração da conexão com o MySQL
def conectar_banco():
    return pymysql.connect(
        host="localhost",
        user="root",        # Altere se o seu usuário do MySQL for diferente
        password="",        # Coloque sua senha do MySQL aqui (se houver)
        database="termoterapia_db",
        cursorclass=pymysql.cursors.DictCursor
    )

# Modelo de dados que a API espera receber do Front-end (Pydantic)
class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str
    role: str          # 'p' (paciente) ou 'f' (fisioterapeuta/estudante)
    subRole: str       # 'paciente', 'profissional' ou 'estudante'
    crefito: str = ""
    instituicao: str = ""

@app.get("/")
def home():
    return {"mensagem": "API de Termoterapia rodando com sucesso!"}

# Rota de Cadastro de Usuários (Salvando no MySQL)
@app.post("/api/register")
def registrar_usuario(usuario: UsuarioSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            # 1. Verifica se o e-mail já existe
            cursor.execute("SELECT id FROM usuarios WHERE email = %s", (usuario.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Este e-mail já está cadastrado.")

            # 2. Insere o novo usuário no MySQL
            sql = """
                INSERT INTO usuarios (nome, email, senha, role, sub_role, crefito, instituicao, aprovado)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            # Fisioterapeuta profissional nasce aprovado (ou pendente, conforme sua regra)
            aprovado = True if usuario.role == 'f' and usuario.subRole == 'profissional' else False

            cursor.execute(sql, (
                usuario.nome,
                usuario.email,
                usuario.senha,
                usuario.role,
                usuario.subRole,
                usuario.crefito,
                usuario.instituicao,
                aprovado
            ))
            conexao.commit()
            
            return {
                "ok": True, 
                "mensagem": "Usuário cadastrado com sucesso no MySQL!",
                "usuario": {
                    "nome": usuario.nome,
                    "email": usuario.email,
                    "role": usuario.role,
                    "subRole": usuario.subRole
                }
            }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conexao.close()

# Modelo para o Login
class LoginSchema(BaseModel):
    email: str
    senha: str

# Rota GET para listar todos os usuários cadastrados no MySQL
@app.get("/api/usuarios")
def listar_usuarios():
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            # Seleciona os dados principais (excluindo a senha por segurança)
            cursor.execute("SELECT id, nome, email, role, sub_role, crefito, instituicao, aprovado FROM usuarios")
            usuarios = cursor.fetchall()
            return {"ok": True, "usuarios": usuarios}
    finally:
        conexao.close()

# Rota de Login (Verificando no MySQL)
@app.post("/api/login")
def fazer_login(dados: LoginSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            # Busca o usuário pelo e-mail e senha
            sql = "SELECT id, nome, email, role, sub_role, crefito, instituicao FROM usuarios WHERE email = %s AND senha = %s"
            cursor.execute(sql, (dados.email, dados.senha))
            usuario = cursor.fetchone()

            if not usuario:
                raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.")

            return {
                "ok": True,
                "mensagem": "Login realizado com sucesso!",
                "usuario": usuario
            }
    finally:
        conexao.close()

@app.get("/api/condicoes")
def listar_condicoes():
    connection = conectar_banco()  # <--- Alterado de conectar_db para conectar_banco
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM condicoes")
            condicoes = cursor.fetchall()
            return {"ok": True, "condicoes": condicoes}
    finally:
        connection.close()

@app.get("/api/recursos")
def listar_recursos():
    connection = conectar_banco()  # <--- Alterado de conectar_db para conectar_banco
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM recursos")
            recursos = cursor.fetchall()
            return {"ok": True, "recursos": recursos}
    finally:
        connection.close()

# =========================================================================
# MODELOS PYDANTIC PARA CADASTRO (POST)
# =========================================================================

class CondicaoCreateSchema(BaseModel):
    nome: str
    regiao: str
    objetivo: str
    resumo_evidencia: str = ""
    evidencia_insuficiente: str = ""
    observacao: str = ""

class RecursoCreateSchema(BaseModel):
    codigo_str: str
    nome: str
    categoria: str
    descricao: str = ""
    mecanismo: str = ""
    certeza: str = ""
    desfechos: str = ""
    parametros_estudos: str = ""
    contraindicacoes: str = ""
    eventos_adversos: str = ""
    referencias: str = ""
    ultima_revisao: str = ""
    cls: str = ""


# =========================================================================
# ROTAS POST PARA CONDIÇÕES E RECURSOS
# =========================================================================

# 1. Cadastrar nova condição clínica no MySQL
@app.post("/api/condicoes")
def criar_condicao(dados: CondicaoCreateSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = """
                INSERT INTO condicoes (nome, regiao, objetivo, resumo_evidencia, evidencia_insuficiente, observacao)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                dados.nome,
                dados.regiao,
                dados.objetivo,
                dados.resumo_evidencia,
                dados.evidencia_insuficiente,
                dados.observacao
            ))
            conexao.commit()
            novo_id = cursor.lastrowid
            return {
                "ok": True,
                "mensagem": "Condição clínica cadastrada com sucesso no MySQL!",
                "id": novo_id
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conexao.close()


# 2. Cadastrar novo recurso de termoterapia no MySQL
@app.post("/api/recursos")
def criar_recurso(dados: RecursoCreateSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = """
                INSERT INTO recursos (codigo_str, nome, categoria, descricao, mecanismo, certeza, desfechos, parametros_estudos, contraindicacoes, eventos_adversos, referencias, ultima_revisao, cls)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                dados.codigo_str,
                dados.nome,
                dados.categoria,
                dados.descricao,
                dados.mecanismo,
                dados.certeza,
                dados.desfechos,
                dados.parametros_estudos,
                dados.contraindicacoes,
                dados.eventos_adversos,
                dados.referencias,
                dados.ultima_revisao,
                dados.cls
            ))
            conexao.commit()
            novo_id = cursor.lastrowid
            return {
                "ok": True,
                "mensagem": "Recurso físico cadastrado com sucesso no MySQL!",
                "id": novo_id
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conexao.close()

# Modelos para o Chat
class SolicitacaoSchema(BaseModel):
    paciente_nome: str
    condicao: str
    mensagem: str

class MensagemSchema(BaseModel):
    solicitacao_id: int
    autor: str          # 'paciente' ou 'fisio'
    texto: str
    hora: str

# 1. Enviar nova solicitação de atendimento (Paciente)
@app.post("/api/chat/solicitacoes")
def criar_solicitacao(dados: SolicitacaoSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = "INSERT INTO solicitacoes_chat (paciente_nome, condicao, mensagem, status) VALUES (%s, %s, %s, 'pendente')"
            cursor.execute(sql, (dados.paciente_nome, dados.condicao, dados.mensagem))
            conexao.commit()
            return {"ok": True, "mensagem": "Solicitação enviada com sucesso!"}
    finally:
        conexao.close()

# 2. Listar todas as solicitações (Para o Fisioterapeuta ver)
@app.get("/api/chat/solicitacoes")
def listar_solicitacoes():
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            cursor.execute("SELECT * FROM solicitacoes_chat ORDER BY id DESC")
            solicitacoes = cursor.fetchall()
            return {"ok": True, "solicitacoes": solicitacoes}
    finally:
        conexao.close()

# 3. Enviar mensagem dentro de uma conversa
@app.post("/api/chat/mensagens")
def enviar_mensagem(dados: MensagemSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = "INSERT INTO mensagens (solicitacao_id, autor, texto, hora) VALUES (%s, %s, %s, %s)"
            cursor.execute(sql, (dados.solicitacao_id, dados.autor, dados.texto, dados.hora))
            conexao.commit()
            return {"ok": True, "mensagem": "Mensagem salva no MySQL!"}
    finally:
        conexao.close()

# 4. Buscar histórico de mensagens de uma solicitação específica
@app.get("/api/chat/mensagens/{solicitacao_id}")
def listar_mensagens(solicitacao_id: int):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = "SELECT * FROM mensagens WHERE solicitacao_id = %s ORDER BY id ASC"
            cursor.execute(sql, (solicitacao_id,))
            mensagens = cursor.fetchall()
            return {"ok": True, "mensagens": mensagens}
    finally:
        conexao.close()

from pydantic import BaseModel

# Modelo para receber o registro de tratamento do paciente
class TratamentoSchema(BaseModel):
    usuario_email: str
    recurso: str
    regiao_local: str
    nivel_dor: int
    sintomas: list  # Recebe a lista de sintomas selecionados

# 1. Rota para salvar o tratamento no MySQL
@app.post("/api/tratamentos")
def salvar_tratamento(dados: TratamentoSchema):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            # Transforma a lista de sintomas em uma única string separada por vírgula
            sintomas_str = ", ".join(dados.sintomas) if dados.sintomas else "Nenhum"
            
            sql = """
                INSERT INTO tratamentos (usuario_email, recurso, regiao_local, nivel_dor, sintomas) 
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                dados.usuario_email, 
                dados.recurso, 
                dados.regiao_local, 
                dados.nivel_dor, 
                sintomas_str
            ))
            conexao.commit()
            return {"ok": True, "mensagem": "Sessão de termoterapia salva no MySQL com sucesso!"}
    finally:
        conexao.close()

# 2. Rota para listar os tratamentos de um usuário específico
@app.get("/api/tratamentos/{email}")
def listar_tratamentos(email: str):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = "SELECT * FROM tratamentos WHERE usuario_email = %s ORDER BY id DESC"
            cursor.execute(sql, (email,))
            tratamentos = cursor.fetchall()
            return {"ok": True, "tratamentos": tratamentos}
    finally:
        conexao.close()

# 3. Rota para deletar um tratamento específico do MySQL pelo ID
@app.delete("/api/tratamentos/{tratamento_id}")
def deletar_tratamento(tratamento_id: int):
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            sql = "DELETE FROM tratamentos WHERE id = %s"
            cursor.execute(sql, (tratamento_id,))
            conexao.commit()
            return {"ok": True, "mensagem": "Registro removido do MySQL com sucesso!"}
    finally:
        conexao.close()

@app.get("/api/relacoes")
def listar_relacoes():
    conexao = conectar_banco()
    try:
        with conexao.cursor() as cursor:
            cursor.execute("SELECT * FROM condicao_recurso")
            relacoes = cursor.fetchall()
            return {"ok": True, "relacoes": relacoes}
    finally:
        conexao.close()
