/* =========================================================================
   CAMADA DE AUTENTICAÇÃO (Integrada com FastAPI e MySQL)
   ========================================================================= */

const SESSION_KEY = 't_user';
const API_URL = 'http://127.0.0.1:8000/api';

export const authService = {
  /* Registra um novo usuário enviando para a API do FastAPI */
  async register({ role, subRole, nome, email, senha, crefito = '', instituicao = '' }) {
    const cleanEmail = email.trim().toLowerCase();

    // Validações rápidas no Front-end antes de enviar
    if (role === 'f') {
      if (subRole === 'profissional' && !crefito.trim()) {
        return { ok: false, error: 'O número do CREFITO é obrigatório para fisioterapeutas.' };
      }
      if (subRole === 'estudante' && !instituicao.trim()) {
        return { ok: false, error: 'O nome da instituição de ensino é obrigatório para estudantes.' };
      }
    }

    try {
      // Envia os dados via POST para a API FastAPI
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: nome.trim(),
          email: cleanEmail,
          senha: senha,
          role: role,
          subRole: role === 'f' ? subRole : 'paciente',
          crefito: crefito.trim(),
          instituicao: instituicao.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Se a API retornar erro (ex: e-mail já cadastrado)
        return { ok: false, error: data.detail || 'Erro ao realizar o cadastro.' };
      }

      // Salva a sessão localmente para o front-end saber que está logado
      const sessionUser = data.usuario || {
        nome: nome.trim(),
        email: cleanEmail,
        role,
        subRole
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

      return { ok: true, user: sessionUser };

    } catch (e) {
      console.error("Erro de conexão com a API:", e);
      return { ok: false, error: 'Não foi possível conectar ao servidor. Verifique se o FastAPI está rodando.' };
    }
  },

  /* Autentica usuário existente consultando a API */
  async login({ email, senha }) {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: cleanEmail,
          senha: senha
        })
      });

      const data = await response.json();

      if (!response.ok) {
        return { ok: false, error: data.detail || 'E-mail ou senha incorretos.' };
      }

      // Salva o usuário retornado pelo MySQL na sessão do navegador
      const sessionUser = data.usuario;
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

      return { ok: true, user: sessionUser };

    } catch (e) {
      console.error("Erro de conexão com a API:", e);
      return { ok: false, error: 'Não foi possível conectar ao servidor. Verifique se o FastAPI está rodando.' };
    }
  },

  /* Encerra a sessão atual */
  async logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('t_role');
  }
};