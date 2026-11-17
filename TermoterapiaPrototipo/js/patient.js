import { ic, PERGUNTAS_TRIAGEM, decidirTriagem, ORIENTACOES, INFORMACOES } from './data.js';
import { S, ld, sv, go, say, H, E, reg, stopTimer, setIntervalId } from './App.js';

const API_URL = 'http://127.0.0.1:8000/api';

/* Emite um alerta sonoro suave via Web Audio API */
function playAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.18 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + 0.35);
    });
  } catch (e) {}
}

/* Verificador em segundo plano para disparar lembretes no horário exato */
let reminderWatcherStarted = false;
export function startReminderWatcher(draw) {
  if (reminderWatcherStarted) return;
  reminderWatcherStarted = true;

  setInterval(() => {
    if (S.role !== 'p') return;
    const now = new Date();
    const hhmm = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const todayKey = now.toDateString() + '_' + hhmm;

    const L = ld('t_lemb', []);
    let changed = false;

    L.forEach((item) => {
      if (item.ativo !== false && item.h === hhmm && item.lastFired !== todayKey) {
        item.lastFired = todayKey;
        changed = true;
        S.activeAlarm = item;
        playAlertBeep();

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Termoterapia: ${item.k}`, {
            body: item.obs || `Está na hora da sua aplicação de ${item.k}.`
          });
        }
        draw();
      }
    });

    if (changed) sv('t_lemb', L);
  }, 1000);
}

export const PatientViews = {
  home_p: () => `
    <main>
      <div class="hero">
        <button class="bell" data-a="bell" aria-label="Lembretes">${ic('bell')}</button>
        <h1>Olá, ${E((ld('t_user', {}).nome || 'paciente').split(' ')[0])}!</h1>
        <p>Seu cuidado na palma da mão.</p>
      </div>
      <div class="acts">
        <button class="act" data-a="go" data-v="tri"><span class="ib o">${ic('th')}</span><span><b>Termoterapia</b>Orientações para o seu tratamento</span></button>
        <button class="act b" data-a="go" data-v="reg"><span class="ib">${ic('reg')}</span><span><b>Registro do tratamento</b>Acompanhe suas sessões</span></button>
        <button class="act b" data-a="go" data-v="inf"><span class="ib">${ic('info')}</span><span><b>Informações</b>Conteúdos confiáveis e simples</span></button>
        <button class="act" data-a="chat"><span class="ib">${ic('chat')}</span><span><b>Fale com seu profissional</b>Conexão direta e segura</span></button>
      </div>
      <div class="note bl">${ic('info')}<span>O app não substitui uma nova avaliação com o seu fisioterapeuta.</span></div>
    </main>`,

  tri: () => {
    const q = PERGUNTAS_TRIAGEM[S.qi];
    return H('Triagem rápida', 1) + `
      <main>
        <p style="margin:0">Pergunta ${S.qi + 1} de 4</p>
        <div class="bar"><i style="width:${(S.qi + 1) * 25}%"></i></div>
        <h2 class="q">${q[0]}</h2>
        ${q[1].map(o => `<button class="opt" data-a="ans" data-v="${o}">${o}</button>`).join('')}
      </main>`;
  },

  alerta: () => H('Antes de começar', 1) + `
    <main>
      <div class="card" style="text-align:center">
        <div class="ib" style="margin:0 auto 10px;width:64px;height:64px;background:var(--warm);color:#C4650D">${ic('warn')}</div>
        <h2 style="font-size:26px">Fale com um fisioterapeuta antes de usar calor ou frio</h2>
        <p>Pelas suas respostas, o uso por conta própria pode não ser seguro. Ferida aberta, dormência, problema de circulação ou dúvida pedem avaliação.</p>
      </div>
      <button class="btn" data-a="find">Encontrar fisioterapeuta próximo</button>
      <button class="btn s" data-a="retri">Refazer a triagem</button>
    </main>`,

  ori: () => {
    const k = S.p.k;
    const o = ORIENTACOES[k];
    const tot = o.m * 60;
    const m = Math.floor(S.left / 60);
    const s = String(S.left % 60).padStart(2, '0');
    const col = k === 'frio' ? 'var(--bl)' : 'var(--or)';
    const circ = 2 * Math.PI * 78;
    const dashOffset = circ * (1 - S.left / tot);

    return H('Orientação', 1) + `
      <main>
        <span class="pill ${k === 'calor' ? 'o' : ''}">${o.n} · ${o.m} minutos</span>
        <div class="ring">
          <svg width="190" height="190" viewBox="0 0 190 190" role="img" aria-label="Tempo restante">
            <circle cx="95" cy="95" r="78" fill="none" stroke="var(--line)" stroke-width="14"/>
            <circle cx="95" cy="95" r="78" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dashOffset}" transform="rotate(-90 95 95)"/>
          </svg>
          <div class="t">${m}:${s}<small>restantes</small></div>
        </div>
        <button class="btn" data-a="timer">${S.run ? 'Pausar' : S.left < tot && S.left > 0 ? 'Continuar' : S.left === 0 ? 'Sessão concluída — reiniciar' : 'Iniciar sessão'}</button>
        <h2 style="font-size:20px;margin:18px 0 10px">Passo a passo</h2>
        <ol class="st">${o.p.map((t, idx) => `<li><b>${idx + 1}</b><span>${t}</span></li>`).join('')}</ol>
        <div class="note">${ic('warn')}<span>${o.a}</span></div>
        <button class="btn s" data-a="open-feedback" data-k="${k}">Registrar como me senti</button>
      </main>`;
  },

  feedback: () => {
    const k = S.p.k || ld('t_ult', 'frio');
    const recursoNome = ORIENTACOES[k] ? ORIENTACOES[k].n : 'Frio';
    const sel = S.p.sel || [];
    const local = S.p.local || '';

    return H('Como me senti', 1) + `
      <main>
        <div class="card">
          <div style="margin-bottom:12px">
            <span class="pill ${k === 'calor' ? 'o' : ''}">Recurso da triagem: ${recursoNome}${local ? ' · ' + E(local) : ''}</span>
          </div>
          <label class="l">Sintomas após a aplicação</label>
          <div class="chips" style="margin:6px 0 14px">
            ${['Alívio', 'Vermelhidão', 'Formigamento', 'Dor aumentou', 'Ardência'].map(x => `<button class="chip ${sel.includes(x) ? 'on' : ''}" aria-pressed="${sel.includes(x)}" data-a="sy" data-v="${x}">${x}</button>`).join('')}
          </div>
          <label class="l" for="dor">Dor agora: <b id="dv">${S.p.d ?? 3}</b> de 10</label>
          <input id="dor" type="range" min="0" max="10" value="${S.p.d ?? 3}" data-a="dor">
          ${sel.some(x => x !== 'Alívio') ? `<div class="note">${ic('warn')}<span>Retire o recurso. Se o sintoma continuar, procure o seu fisioterapeuta.</span></div>` : ''}
          <button class="btn" data-a="savereg" data-k="${k}">Salvar registro</button>
        </div>
      </main>`;
  },

  reg: () => {
    const L = S.dbRegs || [];
    return H('Seus registros', S.h.length) + `
      <main>
        ${L.length
          ? L.map((r) => `
            <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <div>
                <b>${E(r.recurso)}${r.regiao_local ? ' · ' + E(r.regiao_local) : ''}</b> · dor ${r.nivel_dor}/10<br>
                <span style="color:var(--mut);font-size:14px">${new Date(r.data_registro).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}${r.sintomas ? ' · ' + E(r.sintomas) : ''}</span>
              </div>
              <button class="chip" data-a="delreg" data-v="${r.id}" aria-label="Remover registro">Remover</button>
            </div>`).join('')
            + `<button class="btn s" data-a="clearreg">Apagar todos os registros</button>`
          : `
            <div class="ph">Nenhum registro ainda. Os registros são criados ao finalizar uma sessão iniciada pela triagem.</div>
            <button class="btn" data-a="go" data-v="tri">Fazer triagem agora</button>`}
      </main>`;
  },

  inf: () => H('Informações', S.h.length) + `
    <main>
      ${INFORMACOES.map((x, i) => `<details ${i === 0 ? 'open' : ''}><summary>${x[0]}</summary><p>${x[1]}</p></details>`).join('')}
      <div class="note">${ic('warn')}<span>A intensidade e o tempo de aplicação devem ser individualizados.</span></div>
    </main>`,

  trat: () => {
    const L = ld('t_lemb', []);
    const notifPerm = 'Notification' in window ? Notification.permission : 'unsupported';

    return H('Lembretes') + `
      <main>
        <div style="margin-bottom:14px">
          <span style="font-size:12px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:0.03em;display:block;margin-bottom:6px">Acesso rápido ao tratamento</span>
          <div class="chips" style="gap:6px">
            <button class="chip" style="padding:6px 11px;font-size:13px" data-a="go" data-v="tri">Nova triagem</button>
            <button class="chip" style="padding:6px 11px;font-size:13px" data-a="carregar-reg-db" data-v="reg">Registros</button>
            <button class="chip" style="padding:6px 11px;font-size:13px" data-a="go" data-v="inf">Guia frio/calor</button>
          </div>
        </div>

        <div class="card">
          <div style="display:flex;gap:8px;margin-bottom:8px">
            <div style="flex:1">
              <label class="l" for="hr">Horário</label>
              <input type="time" id="hr" value="08:00" style="width:100%;margin-top:4px">
            </div>
            <div style="flex:1">
              <label class="l" for="lk">Recurso</label>
              <select id="lk" style="margin:4px 0 0"><option value="Frio">Frio</option><option value="Calor">Calor</option></select>
            </div>
          </div>
          <label class="l" for="lobs">Observação (opcional)</label>
          <input class="in" id="lobs" placeholder="Ex: Joelho direito, antes do exercício" style="margin:4px 0 10px;padding:10px 12px">
          <button class="btn" data-a="addl">Salvar lembrete</button>
          ${notifPerm === 'default' ? `<button class="btn s" data-a="req-notif" style="margin-top:8px;padding:10px;font-size:14px">Ativar alertas no navegador</button>` : ''}
        </div>

        <h2 style="font-size:18px;margin:14px 0 8px">Seus horários</h2>
        ${L.map((x, i) => {
          const ativo = x.ativo !== false;
          return `
            <div class="card" style="display:flex;justify-content:space-between;align-items:center;gap:10px;opacity:${ativo ? '1' : '0.55'}">
              <div>
                <b style="font-size:18px">${x.h}</b> · <span class="pill ${x.k === 'Calor' ? 'o' : ''}">${x.k}</span>
                ${x.obs ? `<div style="color:var(--mut);font-size:13px;margin-top:4px">${E(x.obs)}</div>` : ''}
              </div>
              <div style="display:flex;gap:6px;flex:none">
                <button class="chip ${ativo ? 'on' : ''}" style="padding:6px 10px;font-size:13px" data-a="togglel" data-v="${i}">${ativo ? 'Ativo' : 'Pausado'}</button>
                <button class="chip" style="padding:6px 10px;font-size:13px" data-a="dell" data-v="${i}" aria-label="Remover lembrete">Remover</button>
              </div>
            </div>`;
        }).join('') || '<div class="ph">Nenhum lembrete criado. Quando chegar o horário, o app emitirá um aviso sonoro e visual.</div>'}
      </main>`;
  },

  evo_p: () => {
    const L = S.dbRegs || [];
    const n = L.length;
    const xs = i => 20 + i * (300 / Math.max(n - 1, 1));
    const pts = L.map((r, i) => xs(i) + ',' + (130 - r.nivel_dor * 11)).join(' ');
    const avg = n ? (L.reduce((a, r) => a + r.nivel_dor, 0) / n).toFixed(1) : 0;
    const al = L.filter(r => r.sintomas && r.sintomas.split(', ').some(x => x !== 'Alívio')).length;

    return H('Evolução') + `
      <main>
        ${n ? `
          <div class="card">
            <b>Dor após cada sessão</b>
            <svg viewBox="0 0 340 150" width="100%" role="img" aria-label="Gráfico de dor por sessão">
              <path d="M20 20H320M20 75H320M20 130H320" stroke="var(--line)"/>
              <polyline points="${pts}" fill="none" stroke="var(--bl)" stroke-width="3" stroke-linejoin="round"/>
              ${L.map((r, i) => `<circle cx="${xs(i)}" cy="${130 - r.nivel_dor * 11}" r="5" fill="var(--or)"/>`).join('')}
            </svg>
            <span style="color:var(--mut);font-size:13px">Escala de 0 a 10. Mais baixo é melhor.</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${[[n, 'sessões'], [avg, 'dor média'], [al, 'com alerta']].map(x => `<div class="card" style="text-align:center;margin:0"><h2>${x[0]}</h2><span style="font-size:13px;color:var(--mut)">${x[1]}</span></div>`).join('')}
          </div>` : `
          <div class="ph">Sem registros ainda. Finalize uma sessão pela triagem para acompanhar a sua evolução.</div>
          <button class="btn" data-a="go" data-v="tri">Fazer triagem agora</button>`}
      </main>`;
  },

  chat: () => {
    const M = ld('t_chat', [[0, 'Olá! Como foi a sessão de hoje?']]);
    return H('Seu fisioterapeuta', 1) + `
      <main>
        ${M.map(m => `<div class="bub ${m[0] ? 'me' : ''}">${E(m[1])}</div>`).join('')}
        <div class="note bl">${ic('info')}<span>Protótipo: as respostas são simuladas. Em caso de dor forte ou piora, procure atendimento.</span></div>
      </main>
      <div class="comp">
        <input id="msg" placeholder="Escreva sua mensagem" aria-label="Mensagem">
        <button class="ib" data-a="send" aria-label="Enviar">${ic('send')}</button>
      </div>`;
  },

  perto: () => H('Fisioterapeutas próximos', 1) + `
    <main>
      <div class="note bl">${ic('info')}<span>Dados de exemplo. A lista real usará a sua localização e a queixa informada.</span></div>
      ${[['Clínica Movimento', 'Fisioterapia ortopédica', '1,2 km'], ['Espaço Reabilita', 'Esportiva e pós-operatório', '2,8 km'], ['Fisio Coluna', 'Coluna e articulações', '4,1 km']].map(x => `
        <div class="card">
          <div style="display:flex;gap:12px;align-items:center">
            <span class="ib" style="color:var(--bl)">${ic('pin')}</span>
            <span><b>${x[0]}</b><br><span style="color:var(--mut);font-size:14px">${x[1]} · ${x[2]}</span></span>
          </div>
          <button class="btn s" data-a="chat">Entrar em contato</button>
        </div>`).join('')}
    </main>`
};

/* Função auxiliar para buscar os registros do MySQL e atualizar o estado */
export async function sincronizarRegistrosDoBanco(drawCallback) {
  const usuarioLogado = ld('t_user', {});
  if (!usuarioLogado.email) return;

  try {
    const res = await fetch(`${API_URL}/tratamentos/${usuarioLogado.email}`);
    const data = await res.json();
    if (data.ok) {
      S.dbRegs = data.tratamentos || [];
      if (drawCallback && typeof drawCallback === 'function') {
        drawCallback();
      }
    }
  } catch (e) {
    console.error("Erro ao buscar registros do MySQL:", e);
  }
}

/* Sincroniza automaticamente após o carregamento completo do App sem causar ReferenceError */
setTimeout(() => {
  sincronizarRegistrosDoBanco(() => {
    if (typeof draw === 'function') draw();
  });
}, 150);

/* Handlers específicos do Paciente */
export function handlePatientAction(a, v, k, draw) {
  if (a === 'chat') { go('chat'); return true; }
  if (a === 'find') { go('perto'); return true; }

  if (a === 'carregar-reg-db' || a === 'reg') {
    sincronizarRegistrosDoBanco(() => {
      go('reg', {}, 0);
      draw();
    });
    return true;
  }

  if (a === 'ans') {
    S.ans.push(v);
    if (S.qi < 3) {
      S.qi++;
      draw();
    } else {
      const localTriagem = S.ans[0] || '';
      const d = decidirTriagem(S.ans);
      S.h.pop();
      if (d === 'alerta') {
        go('alerta', {}, 0);
      } else {
        sv('t_ult', d);
        sv('t_ult_local', localTriagem);
        S.left = ORIENTACOES[d].m * 60;
        go('ori', { k: d, local: localTriagem }, 0);
      }
    }
    return true;
  }

  if (a === 'retri') {
    S.qi = 0;
    S.ans = [];
    go('tri', {}, 0);
    return true;
  }

  if (a === 'timer') {
    const tot = ORIENTACOES[S.p.k].m * 60;
    if (S.run) { stopTimer(); draw(); return true; }
    if (S.left === 0) S.left = tot;
    S.run = true;
    const id = setInterval(() => {
      S.left--;
      if (S.left <= 0) {
        S.left = 0;
        stopTimer();
        say('Tempo concluído. Retire o recurso e olhe a pele.');
      } else {
        draw();
      }
    }, 1000);
    setIntervalId(id);
    draw();
    return true;
  }

  if (a === 'open-feedback') {
    stopTimer();
    const localSalvo = S.p.local || ld('t_ult_local', '');
    go('feedback', { k, local: localSalvo, sel: [], d: 3 });
    return true;
  }

  if (a === 'sy') {
    const s = S.p.sel || [];
    S.p.sel = s.includes(v) ? s.filter(x => x !== v) : [...s, v];
    draw();
    return true;
  }

  if (a === 'savereg') {
    const usuarioLogado = ld('t_user', {});
    if (!usuarioLogado.email) {
      alert("Você precisa estar logado para salvar o registro.");
      return true;
    }

    const recursoKey = k || S.p.k || ld('t_ult', 'frio');
    const recursoNome = ORIENTACOES[recursoKey] ? ORIENTACOES[recursoKey].n : 'Frio';
    const local = S.p.local || ld('t_ult_local', '');

    fetch(`${API_URL}/tratamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usuario_email: usuarioLogado.email,
        recurso: recursoNome,
        regiao_local: local,
        nivel_dor: S.p.d ?? 3,
        sintomas: S.p.sel || []
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        sincronizarRegistrosDoBanco(() => {
          S.h = [];
          go('reg', {}, 0);
          say('Registro salvo no banco de dados.');
          draw();
        });
      }
    })
    .catch(err => console.error("Erro ao salvar no banco:", err));

    return true;
  }

  if (a === 'delreg') {
    fetch(`${API_URL}/tratamentos/${v}`, {
      method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        sincronizarRegistrosDoBanco(() => {
          say('Registro removido.');
          draw();
        });
      }
    })
    .catch(err => console.error("Erro ao deletar do banco:", err));

    return true;
  }

  if (a === 'clearreg') {
    const L = S.dbRegs || [];
    if (L.length === 0) return true;

    Promise.all(L.map(r => fetch(`${API_URL}/tratamentos/${r.id}`, { method: 'DELETE' })))
      .then(() => {
        sincronizarRegistrosDoBanco(() => {
          say('Todos os registros foram apagados.');
          draw();
        });
      })
      .catch(err => console.error("Erro ao limpar registros:", err));

    return true;
  }

  if (a === 'addl') {
    const h = document.querySelector('#hr').value || '08:00';
    const rec = document.querySelector('#lk').value;
    const obs = document.querySelector('#lobs').value.trim();
    const L = ld('t_lemb', []);

    L.push({ h, k: rec, obs, ativo: true });
    L.sort((a, b) => a.h.localeCompare(b.h));
    sv('t_lemb', L);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    say(`Lembrete criado para as ${h}.`);
    return true;
  }

  if (a === 'togglel') {
    const L = ld('t_lemb', []);
    if (L[+v]) {
      L[+v].ativo = L[+v].ativo === false ? true : false;
      sv('t_lemb', L);
      draw();
    }
    return true;
  }

  if (a === 'dell') {
    const L = ld('t_lemb', []);
    L.splice(+v, 1);
    sv('t_lemb', L);
    say('Lembrete removido.');
    return true;
  }

  if (a === 'req-notif') {
    if ('Notification' in window) {
      Notification.requestPermission().then(() => draw());
    }
    return true;
  }

  if (a === 'alarm-dismiss') {
    S.activeAlarm = null;
    draw();
    return true;
  }

  if (a === 'alarm-open') {
    S.activeAlarm = null;
    S.left = ORIENTACOES[k].m * 60;
    go('ori', { k, local: ld('t_ult_local', '') });
    return true;
  }

  if (a === 'send') {
    const x = document.querySelector('#msg').value.trim();
    if (!x) return true;
    const M = ld('t_chat', [[0, 'Olá! Como foi a sessão de hoje?']]);
    M.push([1, x], [0, 'Recebido. Seu fisioterapeuta responde em breve.']);
    sv('t_chat', M);
    draw();
    return true;
  }

  return false;
}