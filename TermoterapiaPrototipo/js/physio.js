import { ic, getRecursosClinicos, getCondicoesClinicas, getRelacoesEvidencia, OBJETIVOS_TERAPEUTICOS } from './data.js';
import { S, sv, go, H, ld, E } from './App.js';

// Variáveis que armazenam os dados vindos do MySQL via API
export let RECURSOS_CLINICOS = null; // null indica estado de carregamento inicial
export let CONDICOES_CLINICAS = {};
export let RELACOES_EVIDENCIA = {};

// Função para inicializar os dados do fisio antes de renderizar
export async function inicializarDadosFisio(drawCallback) {
  try {
    const [listaRecursos, listaCondicoes, listaRelacoes] = await Promise.all([
      getRecursosClinicos(),
      getCondicoesClinicas(),
      getRelacoesEvidencia()
    ]);

    RECURSOS_CLINICOS = {};
    if (Array.isArray(listaRecursos)) {
      listaRecursos.forEach(r => { RECURSOS_CLINICOS[r.id] = r; });
    }

    CONDICOES_CLINICAS = {};
    if (Array.isArray(listaCondicoes)) {
      listaCondicoes.forEach(c => { CONDICOES_CLINICAS[c.id] = c; });
    }

    RELACOES_EVIDENCIA = {};
    if (Array.isArray(listaRelacoes)) {
      listaRelacoes.forEach(rel => {
        const chave = `${rel.condicao_id}__${rel.recurso_id}`;
        RELACOES_EVIDENCIA[chave] = rel;
      });
    }

    if (drawCallback && typeof drawCallback === 'function') {
      drawCallback();
    }
  } catch (err) {
    console.error("Erro ao inicializar dados do fisio:", err);
  }
}

// Inicializa e força o redesenho da tela quando os dados chegarem
inicializarDadosFisio(() => {
  if (typeof draw === 'function') draw();
});

const getPatientChatRequests = () => ld('t_patient_requests', [
  { id: 'req_1', paciente: 'Ana Souza', condicao: 'Osteoartrite de joelho', mensagem: 'Olá, doutor(a)! Gostaria de orientações sobre o uso de calor superficial antes dos exercícios.', status: 'pendente', data: 'Hoje, 10:30' },
  { id: 'req_2', paciente: 'Carlos Silva', condicao: 'Entorse de tornozelo', mensagem: 'Boa tarde. Posso alternar crioterapia com compressão elástica após o 3º dia?', status: 'aceito', data: 'Ontem, 16:45' }
]);

export const PhysioViews = {
  home_f: () => {
    // Proteção de carregamento caso os dados do MySQL ainda não tenham retornado
    if (!RECURSOS_CLINICOS) {
      return H('Termoterapia') + `<main><div class="ph">Carregando dados do banco MySQL...</div></main>`;
    }

    const u = ld('t_user', {});
    const isEstudante = u.subRole === 'estudante';
    const condSel = S.p.c || 'todas';
    const abaBusca = S.p.sub || 'condicoes'; // 'condicoes' ou 'recursos'

    // Filtra os recursos com base na condição selecionada
    let keys = [];
    if (condSel === 'todas') {
      keys = Object.keys(RECURSOS_CLINICOS);
    } else {
      keys = Object.keys(RECURSOS_CLINICOS).filter(recId => {
        const relKey = `${condSel}__${recId}`;
        return RELACOES_EVIDENCIA[relKey] !== undefined;
      });
    }

    const condObj = condSel !== 'todas' ? CONDICOES_CLINICAS[condSel] : null;

    return `
      <main>
        <div class="hero" style="padding-bottom:22px">
          <button class="bell" data-a="bell" aria-label="Avisos">${ic('bell')}</button>
          <span class="pill o" style="color:var(--navy);margin-bottom:6px;font-size:11px">
            ${isEstudante ? 'PERFIL ESTUDANTE (Acesso Acadêmico)' : 'PERFIL PROFISSIONAL (CREFITO ATIVO)'}
          </span>
          <h1>Termoterapia</h1>
          <p>Apoio à decisão clínica e suporte aos pacientes</p>
        </div>

        ${isEstudante ? `
          <div class="note" style="background:var(--ice);border-color:var(--bl);margin-bottom:14px">
            ${ic('info')}
            <span><b>Acesso Acadêmico:</b> O atendimento e suporte por chat aos pacientes é exclusivo para profissionais formados com CREFITO ativo.</span>
          </div>
        ` : ''}

        <!-- Seletor entre Condições e Recursos -->
        <div role="tablist" aria-label="Categorias de busca" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;background:var(--ice);padding:5px;border-radius:14px;margin:12px 0 14px">
          <button role="tab" aria-selected="${abaBusca === 'condicoes'}" data-a="f-sub" data-v="condicoes"
            style="padding:9px 8px;border-radius:10px;font-weight:700;font-size:14px;background:${abaBusca === 'condicoes' ? 'var(--card)' : 'transparent'};color:${abaBusca === 'condicoes' ? 'var(--ink)' : 'var(--mut)'};box-shadow:${abaBusca === 'condicoes' ? '0 2px 6px #12294a14' : 'none'}">
            Condições (${Object.keys(CONDICOES_CLINICAS).length})
          </button>
          <button role="tab" aria-selected="${abaBusca === 'recursos'}" data-a="f-sub" data-v="recursos"
            style="padding:9px 8px;border-radius:10px;font-weight:700;font-size:14px;background:${abaBusca === 'recursos' ? 'var(--card)' : 'transparent'};color:${abaBusca === 'recursos' ? 'var(--ink)' : 'var(--mut)'};box-shadow:${abaBusca === 'recursos' ? '0 2px 6px #12294a14' : 'none'}">
            Recursos (${Object.keys(RECURSOS_CLINICOS).length})
          </button>
        </div>

        ${abaBusca === 'condicoes' ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
            <h2 style="font-size:18px">Condições clínicas recorrentes</h2>
            <span class="pill">${Object.keys(CONDICOES_CLINICAS).length} cadastradas</span>
          </div>
          <p style="color:var(--mut);font-size:13px;margin:0 0 12px">Selecione uma condição para filtrar automaticamente os recursos indicados.</p>

          ${Object.entries(CONDICOES_CLINICAS).map(([k, c]) => `
            <div class="card" role="button" tabindex="0" data-a="pick-cond" data-k="${k}"
              style="cursor:pointer;border-left:5px solid var(--bl)">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
                <span style="font-size:12px;font-weight:700;color:var(--mut)">${c.regiao || 'Geral'}</span>
                <span class="pill">${c.objetivo || 'Reabilitação'}</span>
              </div>
              <b style="font-size:16px;display:block;margin-bottom:4px">${c.nome}</b>
              <p style="margin:0 0 8px;font-size:13px;color:var(--mut)">${c.resumo_evidencia || c.observacao || 'Consulte os recursos associados.'}</p>
              <span style="font-size:13px;font-weight:700;color:var(--bl)">Ver recursos associados →</span>
            </div>
          `).join('')}

        ` : `
          ${condObj ? `
            <div class="card" style="background:var(--ice);border-color:var(--bl)">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px">
                <b style="font-size:15px">${condObj.nome}</b>
                <span class="pill">${condObj.regiao}</span>
              </div>
              <p style="margin:4px 0;font-size:13px"><b>Objetivo:</b> ${condObj.objetivo}</p>
              <p style="margin:4px 0;font-size:13px"><b>Resumo Clínico:</b> ${condObj.resumo_evidencia || condObj.observacao || 'Sem observações.'}</p>
              <button class="chip" style="margin-top:8px;padding:4px 10px;font-size:12px" data-a="reset-cond">Ver todos os recursos</button>
            </div>` : ''}

          <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px">
            <h2 style="font-size:17px">${keys.length} recurso(s) encontrado(s)</h2>
            <button class="chip" style="padding:5px 11px;font-size:12px" data-a="go" data-v="cmp">Comparar lado a lado</button>
          </div>

          ${keys.map(k => {
            const r = RECURSOS_CLINICOS[k];
            if (!r) return '';

            const relKey = `${condSel}__${k}`;
            const rel = RELACOES_EVIDENCIA[relKey];

            const beneficio = rel?.beneficio || r.descricao || 'Aplicação voltada ao alívio e suporte terapêutico.';
            const limitacoes = rel?.limitacoes || 'Efeito varia conforme protocolo e resposta individual.';
            const seguranca = rel?.seguranca || r.contraindicacoes || 'Avaliar sensibilidade cutânea antes da aplicação.';
            const certezaTag = rel?.certeza || r.certeza || 'Moderada';

            return `
              <div class="card res ${r.cls || ''}" tabindex="0" role="button" data-a="go" data-v="ficha" data-k="${k}">
                <div style="margin-bottom:6px">
                  <span class="pill ${r.cls === 'c' ? 'o' : ''}">Evidência: ${certezaTag}</span>
                </div>
                <h3>${r.nome}</h3>
                <p style="font-size:12px;color:var(--mut);margin-bottom:6px">${r.categoria || 'Termoterapia'}</p>
                <p style="margin:3px 0;font-size:13.5px"><b>• Possível benefício:</b> ${beneficio}</p>
                <p style="margin:3px 0;font-size:13.5px"><b>• Limitações:</b> ${limitacoes}</p>
                <p style="margin:3px 0;font-size:13.5px"><b>• Segurança:</b> ${seguranca}</p>
                <div style="margin-top:8px;font-size:13px;font-weight:700;color:var(--bl)">Abrir ficha científica completa →</div>
              </div>`;
          }).join('') || '<div class="ph">Nenhum recurso encontrado para essa combinação.</div>'}
        `}

        <div class="note" style="margin-top:14px">
          ${ic('shield')}
          <span><b>Apoia a decisão clínica, mas não substitui avaliação, julgamento e responsabilidade profissional.</b></span>
        </div>
      </main>`;
  },

  ficha: () => {
    if (!RECURSOS_CLINICOS) return H('Ficha científica') + `<main><div class="ph">Carregando...</div></main>`;
    const k = S.p.k;
    const r = RECURSOS_CLINICOS[k];
    if (!r) return H('Ficha científica') + `<main><div class="ph">Recurso não encontrado.</div></main>`;

    return H('Ficha científica', 1) + `
      <main>
        <div class="card">
          <span class="pill ${r.cls === 'c' ? 'o' : ''}">${r.categoria || 'Termoterapia'}</span>
          <h2 style="font-size:24px;margin:8px 0 4px">${r.nome}</h2>
          <p style="color:var(--mut);font-size:14px;margin:0 0 10px">${r.descricao || ''}</p>
          <p style="margin:6px 0"><b>Mecanismo / efeitos fisiológicos:</b> ${r.mecanismo || 'Não informado.'}</p>
        </div>

        <div class="card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
            <b style="font-size:16px">O que a evidência mostra</b>
            <span class="pill">Certeza: ${r.certeza || 'Moderada'}</span>
          </div>
          <p style="font-size:13px;color:var(--mut);margin:0 0 8px"><b>Desfechos avaliados:</b> ${r.desfechos || 'Alívio álgico e funcionalidade.'}</p>
        </div>

        <div class="card">
          <b style="font-size:16px;display:block;margin-bottom:4px">Parâmetros encontrados nos estudos</b>
          <p style="margin:0;font-size:14px">${r.parametros_estudos || r.parametrosEstudos || '15 a 20 minutos conforme protocolo clínico.'}</p>
        </div>

        <div class="card" style="border-left:5px solid var(--or)">
          <b style="font-size:16px;display:block;margin-bottom:6px">Segurança e precauções</b>
          <p style="margin:4px 0;font-size:14px"><b>Contraindicações:</b> ${r.contraindicacoes || 'Avaliar sensibilidade cutânea.'}</p>
          <p style="margin:4px 0;font-size:14px"><b>Eventos adversos:</b> ${r.eventos_adversos || r.eventosAdversos || 'Raros quando aplicados corretamente.'}</p>
        </div>

        <div class="card">
          <b style="font-size:16px;display:block;margin-bottom:6px">Referências científicas</b>
          <p style="margin:0;font-size:13px;color:var(--mut)">${r.referencias || 'Literatura baseada em evidências em reabilitação.'}</p>
          <p style="margin:8px 0 0;font-size:12px;color:var(--bl);font-weight:700">Última revisão: ${r.ultima_revisao || r.ultimaRevisao || '2026'}</p>
        </div>

        <div class="note">
          ${ic('shield')}
          <span>Apoia a decisão clínica, mas não substitui avaliação, julgamento e responsabilidade profissional.</span>
        </div>
      </main>`;
  },

  cmp: () => {
    if (!RECURSOS_CLINICOS) return H('Comparar') + `<main><div class="ph">Carregando...</div></main>`;
    const keys = Object.keys(RECURSOS_CLINICOS);
    const a = S.p.a || keys[0] || '1';
    const b = S.p.b || keys[1] || '2';
    const A1 = RECURSOS_CLINICOS[a] || {};
    const B1 = RECURSOS_CLINICOS[b] || {};
    const opts = x => Object.entries(RECURSOS_CLINICOS).map(([k, r]) => `<option value="${k}" ${String(k) === String(x) ? 'selected' : ''}>${r.nome}</option>`).join('');

    return H('Comparar 2 recursos', 1) + `
      <main>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div><label class="l" for="ca">Recurso A</label><select id="ca" data-a="cmp">${opts(a)}</select></div>
          <div><label class="l" for="cb">Recurso B</label><select id="cb" data-a="cmp">${opts(b)}</select></div>
        </div>
        ${[
          ['Categoria', A1.categoria, B1.categoria],
          ['Certeza da evidência', A1.certeza, B1.certeza],
          ['Mecanismo', A1.mecanismo, B1.mecanismo],
          ['Parâmetros', A1.parametros_estudos || A1.parametrosEstudos, B1.parametros_estudos || B1.parametrosEstudos],
          ['Contraindicações', A1.contraindicacoes, B1.contraindicacoes]
        ].map(x => `
          <div class="card">
            <b style="color:var(--mut);font-size:13px">${x[0]}</b>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px;font-size:13.5px">
              <div>${x[1] || ''}</div>
              <div style="border-left:1px solid var(--line);padding-left:10px">${x[2] || ''}</div>
            </div>
          </div>`).join('')}
        <div class="note bl">${ic('info')}<span>A comparação apresenta características sem pressupor superioridade universal.</span></div>
      </main>`;
  },

  evo_f: () => {
    const registros = ld('t_clin_reg', []);
    return H('Evolução clínica') + `
      <main>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-size:13px;font-weight:700;color:var(--mut)">${registros.length} registro(s) salvo(s)</span>
          ${registros.length ? `<button class="chip" style="padding:5px 10px;font-size:12px" data-a="clear-clin">Limpar tudo</button>` : ''}
        </div>

        ${registros.length ? registros.map((item, i) => `
          <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div>
                <b style="display:block;font-size:16px">${E(item.paciente || 'Paciente')}</b>
                <span style="font-size:13px;color:var(--mut)">${item.data} · Região: <b>${E(item.regiao || 'Não informada')}</b></span>
              </div>
              <button class="chip" style="padding:5px 9px;font-size:12px" data-a="del-clin" data-v="${i}">Remover</button>
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--line);font-size:14px">
              <p style="margin:3px 0"><b>Recurso:</b> ${E(item.recurso)}</p>
              <p style="margin:3px 0"><b>Objetivo:</b> ${E(item.objetivo)}</p>
              ${item.obs ? `<p style="margin:6px 0 0;background:var(--ice);padding:8px;border-radius:8px"><b>Evolução:</b> ${E(item.obs)}</p>` : ''}
            </div>
          </div>
        `).join('') : `
          <div class="ph">Nenhum registro clínico ainda.</div>
        `}
      </main>`;
  }
};

export function handlePhysioAction(a, v, k, e, draw) {
  if (a === 'f-sub') {
    S.p.sub = v;
    draw();
    return true;
  }

  if (a === 'pick-cond') {
    S.p.c = k;
    S.p.sub = 'recursos'; // Alterna para a aba de recursos exibindo os filtrados pela condição
    draw();
    return true;
  }

  if (a === 'reset-cond') {
    S.p.c = 'todas';
    S.p.obj = 'todos';
    S.p.rec = 'todos';
    draw();
    return true;
  }

  if (a === 'del-clin') {
    const lista = ld('t_clin_reg', []);
    lista.splice(+v, 1);
    sv('t_clin_reg', lista);
    draw();
    return true;
  }

  if (a === 'clear-clin') {
    sv('t_clin_reg', []);
    draw();
    return true;
  }

  return false;
}