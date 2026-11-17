/* Ícones SVG */
export const ICONS = {
  th: 'M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z',
  reg: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 12h6M9 16h4',
  info: 'M12 12v5M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  chat: 'M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1 1 21 11.5z',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  home: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  trend: 'M3 17l6-6 4 4 8-8M14 7h7v7',
  user: 'M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  search: 'M21 21l-4.3-4.3M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  star: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21 7 14.2 2 9.3l6.9-1z',
  back: 'M15 18l-6-6 6-6',
  warn: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
  snow: 'M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9L4.9 19.1',
  fl: 'M12 2c2 3.5 6 6.2 6 11a6 6 0 1 1-12 0c0-2.4 1.2-4.7 3-6.5-.2 2.2 1.2 3.5 2.5 3.5C11 7 11 4.2 12 2z',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4z',
  pin: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  a11y: 'M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM5 9h14M12 9v6M12 15l-3 5M12 15l3 5',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5V5a2 2 0 0 1 2-2h14v14H6.5A2.5 2.5 0 0 0 4 19.5z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'
};

export const ic = (k, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[k]}"/></svg>`;

/* =========================================================================
   DADOS DO PACIENTE
   ========================================================================= */
export const PERGUNTAS_TRIAGEM = [
  ['Onde está o desconforto?', ['Ombro ou pescoço', 'Costas ou lombar', 'Joelho ou tornozelo', 'Outro local']],
  ['Como a dor começou?', ['Após pancada, torção ou esforço', 'Aos poucos, sem lesão', 'Rigidez ou tensão', 'Após cirurgia ou orientação do fisio']],
  ['Há quanto tempo?', ['Menos de 48 horas', 'Entre 2 e 7 dias', 'Mais de uma semana']],
  ['Você tem algum destes sinais?', ['Inchaço ou local quente', 'Ferida, dormência ou alteração de pele', 'Problema de circulação ou diabetes', 'Nenhum desses']]
];

export const decidirTriagem = (a) => {
  if (a[3] === 'Ferida, dormência ou alteração de pele' || a[3] === 'Problema de circulação ou diabetes' || a[1] === 'Após cirurgia ou orientação do fisio') return 'alerta';
  if (a[2] === 'Menos de 48 horas' || a[3] === 'Inchaço ou local quente' || a[1] === 'Após pancada, torção ou esforço') return 'frio';
  return 'calor';
};

export const ORIENTACOES = {
  frio: {
    n: 'Frio', m: 15, c: 'bl',
    p: ['Envolva a bolsa fria em uma toalha fina antes de encostar na pele.', 'Apoie com firmeza no local por 15 minutos, sem apertar.', 'Observe a pele na metade do tempo. Se doer ou arder, pare.', 'Retire e aguarde ao menos 1 hora antes de repetir.'],
    a: 'Nunca coloque gelo direto na pele e não ultrapasse 20 minutos.'
  },
  calor: {
    n: 'Calor', m: 20, c: 'or',
    p: ['Aqueça a bolsa e teste no antebraço: precisa estar morna, nunca quente.', 'Use uma toalha entre a bolsa e a pele e descanse por 20 minutos.', 'Não deite sobre a bolsa nem durma durante a aplicação.', 'Ao terminar, hidrate e observe a cor da pele.'],
    a: 'Não use calor se o local estiver inchado, avermelhado ou quente.'
  }
};

export const INFORMACOES = [
  ['Quando escolher frio', 'Indicado nas primeiras 48 horas após pancadas, torções e quando há inchaço ou calor local. O frio reduz o fluxo sanguíneo local e ajuda a controlar a dor e o edema.'],
  ['Quando escolher calor', 'Indicado para rigidez muscular, tensão e dores que duram mais de uma semana sem sinais de inflamação. O calor aumenta a circulação e relaxa a musculatura.'],
  ['Sinais para parar imediatamente', 'Dormência, formigamento forte, pele esbranquiçada ou muito vermelha, ardência ou aumento da dor. Retire o recurso e procure avaliação.'],
  ['Quando falar com o fisioterapeuta', 'Em pós-operatório, diabetes, alteração de sensibilidade ou de circulação, feridas abertas ou quando não houver melhora após 48 horas.']
];

/* =========================================================================
   MÓDULO DE TERMOTERAPIA — INTEGRAÇÃO COM A API (FastAPI / MySQL)
   ========================================================================= */

const API_URL = 'http://127.0.0.1:8000/api';

export const OBJETIVOS_TERAPEUTICOS = {
  analgesia: 'Analgesia',
  edema: 'Redução/controle de sintomas de edema',
  rigidez: 'Redução de rigidez',
  preparacao: 'Preparação para movimento/exercício',
  recuperacao: 'Recuperação pós-exercício',
  adm: 'Melhora de amplitude de movimento (associado)',
  relaxamento: 'Conforto/relaxamento muscular'
};

/* Função para buscar os recursos clínicos diretamente da API */
export async function getRecursosClinicos() {
  try {
    const response = await fetch(`${API_URL}/recursos`);
    const data = await response.json();
    return data.recursos || [];
  } catch (error) {
    console.error("Erro ao buscar recursos da API:", error);
    return [];
  }
}

/* Função para buscar as condições clínicas diretamente da API */
export async function getCondicoesClinicas() {
  try {
    const response = await fetch(`${API_URL}/condicoes`);
    const data = await response.json();
    return data.condicoes || [];
  } catch (error) {
    console.error("Erro ao buscar condições da API:", error);
    return [];
  }
}

export async function getRelacoesEvidencia() {
  try {
    const response = await fetch(`${API_URL}/relacoes`);
    const data = await response.json();
    return data.relacoes || [];
  } catch (error) {
    console.error("Erro ao buscar relações da API:", error);
    return [];
  }
}

export async function getFavoritos(usuarioId) {
  try {
    const response = await fetch(`${API_URL}/favoritos/${usuarioId}`);
    const data = await response.json();
    // Normaliza os IDs para string para garantir compatibilidade com as chaves do front-end
    return (data.favoritos || []).map(id => String(id));
  } catch (error) {
    console.error("Erro ao buscar favoritos:", error);
    return [];
  }
}

export async function salvarFavoritoApi(usuarioId, recursoId, isFavorito) {
  try {
    if (isFavorito) {
      await fetch(`${API_URL}/favoritos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: Number(usuarioId), recurso_id: Number(recursoId) })
      });
    } else {
      await fetch(`${API_URL}/favoritos/${usuarioId}/${recursoId}`, {
        method: 'DELETE'
      });
    }
  } catch (error) {
    console.error("Erro ao atualizar favorito na API:", error);
  }
}