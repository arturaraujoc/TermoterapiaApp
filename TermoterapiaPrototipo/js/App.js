import { ic } from './data.js';
import { authService } from './auth.js';
import { PatientViews, handlePatientAction, startReminderWatcher } from './patient.js';
import { PhysioViews, handlePhysioAction } from './physio.js';

const $ = (s) => document.querySelector(s);
const A = $('#app');

/* Persistência Local */
export const ld = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v == null ? d : v;
  } catch (e) {
    return d;
  }
};

export const sv = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {}
};

/* Acessibilidade (WCAG 2.1 AA / eMAG) */
export const getA11y = () => ld('t_a11y', { font: 'normal', contrast: 'normal', motion: 'normal' });

export function applyA11y() {
  const cfg = getA11y();
  const root = document.documentElement;
  root.dataset.font = cfg.font;
  root.dataset.contrast = cfg.contrast;
  root.dataset.motion = cfg.motion;
}

export function renderA11yControls() {
  const cfg = getA11y();
  return `
    <section class="a11y-panel" aria-labelledby="a11y-title">
      <h2 id="a11y-title" style="font-size:1.15rem;margin-bottom:10px;display:flex;align-items:center;gap:8px">
        ${ic('a11y')} Preferências de exibição
      </h2>

      <div class="a11y-group">
        <label class="l">Tamanho do texto</label>
        <div class="a11y-row" role="group" aria-label="Tamanho do texto">
          <button class="chip ${cfg.font === 'normal' ? 'on' : ''}" aria-pressed="${cfg.font === 'normal'}" data-a="a11y-font" data-v="normal">A (100%)</button>
          <button class="chip ${cfg.font === 'large' ? 'on' : ''}" aria-pressed="${cfg.font === 'large'}" data-a="a11y-font" data-v="large">A+ (115%)</button>
          <button class="chip ${cfg.font === 'xlarge' ? 'on' : ''}" aria-pressed="${cfg.font === 'xlarge'}" data-a="a11y-font" data-v="xlarge">A++ (130%)</button>
        </div>
      </div>

      <div class="a11y-group">
        <label class="l">Contraste de cores</label>
        <div class="a11y-row" role="group" aria-label="Contraste de cores">
          <button class="chip ${cfg.contrast === 'normal' ? 'on' : ''}" aria-pressed="${cfg.contrast === 'normal'}" data-a="a11y-contrast" data-v="normal">Padrão</button>
          <button class="chip ${cfg.contrast === 'high' ? 'on' : ''}" aria-pressed="${cfg.contrast === 'high'}" data-a="a11y-contrast" data-v="high">Alto contraste</button>
        </div>
      </div>

      <div class="a11y-group">
        <label class="l">Animações</label>
        <div class="a11y-row" role="group" aria-label="Animações">
          <button class="chip ${cfg.motion === 'normal' ? 'on' : ''}" aria-pressed="${cfg.motion === 'normal'}" data-a="a11y-motion" data-v="normal">Ativadas</button>
          <button class="chip ${cfg.motion === 'reduced' ? 'on' : ''}" aria-pressed="${cfg.motion === 'reduced'}" data-a="a11y-motion" data-v="reduced">Reduzidas</button>
        </div>
      </div>
    </section>`;
}

/* Utilitários Compartilhados */
export const E = (s) => String(s).replace(/[<>&]/g, c => ({ '<': '<', '>': '>', '&': '&' }[c]));

export const H = (t, b, hideA11y = false) => `
  <header>
    ${b ? `<button class="ib" data-a="back" aria-label="Voltar">${ic('back')}</button>` : ''}
    <h1>${t}</h1>
    ${!hideA11y ? `
      <button class="a11y-btn-header" data-a="open-a11y" aria-label="Acessibilidade" title="Acessibilidade">
        ${ic('a11y')}
      </button>` : ''}
  </header>`;

export const reg = () => ld('t_reg', []);
export const favs = () => ld('t_fav', []);

/* Estado Global e Navegação */
export let S = {
  role: ld('t_role', null),
  authMode: null,
  regRole: 'p',
  regSubRole: 'profissional',
  s: 'home',
  p: {},
  h: [],
  qi: 0,
  ans: [],
  tm: null,
  left: 0,
  run: false,
  toast: '',
  roleA11yPage: false,
  activeAlarm: null
};

let iv;
export const setIntervalId = (id) => { iv = id; };
export const stopTimer = () => { clearInterval(iv); S.run = false; };

export const go = (s, p = {}, push = 1) => {
  if (push) S.h.push([S.s, S.p]);
  S.s = s;
  S.p = p;
  draw();
};

export const tab = (s) => {
  S.h = [];
  S.s = s;
  S.p = {};
  draw();
};

export const back = () => {
  const x = S.h.pop();
  if (x) {
    S.s = x[0];
    S.p = x[1];
    draw();
  }
};

export const say = (t) => {
  S.toast = t;
  draw();
  setTimeout(() => {
    S.toast = '';
    draw();
  }, 2600);
};

/* Barra de Navegação Dinâmica sem a aba de Favoritos */
const NAV = (r) => {
  const u = ld('t_user', {});
  const isEstudante = r === 'f' && u.subRole === 'estudante';

  const tabs = r === 'p'
    ? [['home', 'Início', 'home'], ['trat', 'Lembretes', 'bell'], ['evo', 'Evolução', 'trend'], ['perfil', 'Perfil', 'user']]
    : isEstudante
      ? [['home', 'Busca', 'search'], ['perfil', 'Perfil', 'user']]
      : [['home', 'Busca', 'search'], ['chat-list', 'Atendimento', 'chat'], ['perfil', 'Perfil', 'user']];

  return `<nav aria-label="Menu">${tabs.map(x => `<button data-a="tab" data-v="${x[0]}" ${S.s === x[0] || (x[0] === 'chat-list' && S.s === 'chat-room') ? 'aria-current="page"' : ''}>${ic(x[2])}${x[1]}</button>`).join('')}</nav>`;
};

/* Telas Compartilhadas */
const SharedViews = {
  welcome: () => `
    <div class="role">
      <div class="moon" aria-hidden="true"></div>
      <div class="sun" aria-hidden="true"></div>
      <button class="a11y-fab" data-a="open-a11y-pre" aria-label="Acessibilidade" title="Acessibilidade">
        ${ic('a11y')}
      </button>
      <main id="main-content" style="padding:0;overflow:visible;flex:none">
        <h1>Termoterapia</h1>
        <p>Calor e frio com orientação segura, do consultório para casa.</p>
        <button class="btn" data-a="auth-view" data-v="login">Entrar</button>
        <button class="btn s" data-a="auth-view" data-v="register">Criar conta</button>
      </main>
    </div>`,

  login: () => `
    <main id="main-content" style="padding-top:16px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <button class="ib" data-a="auth-view" data-v="" aria-label="Voltar">${ic('back')}</button>
        <button class="a11y-btn-header" data-a="open-a11y-pre" aria-label="Acessibilidade" title="Acessibilidade">
          ${ic('a11y')}
        </button>
      </div>
      <h1 style="font-size:30px;margin:14px 0 4px">Entrar</h1>
      <p style="color:var(--mut);margin:0 0 16px">Acesse sua conta.</p>

      <label class="l" for="le">E-mail</label>
      <input class="in" id="le" type="email" autocomplete="email" inputmode="email" placeholder="seuemail@exemplo.com" required>

      <label class="l" for="lp">Senha</label>
      <input class="in" id="lp" type="password" autocomplete="current-password" placeholder="Sua senha" required>

      <div class="note" id="err" role="alert" aria-live="assertive" hidden></div>

      <button class="btn" data-a="do-login">Entrar na conta</button>

      <div style="text-align:center;margin-top:14px">
        <span style="color:var(--mut);font-size:14px">Ainda não tem cadastro? </span>
        <button data-a="auth-view" data-v="register" style="color:var(--bl);font-weight:700;font-size:14px;text-decoration:underline">Criar conta</button>
      </div>
    </main>`,

  register: () => {
    const isP = S.regRole === 'p';
    const isEstudante = !isP && S.regSubRole === 'estudante';

    return `
      <main id="main-content" style="padding-top:16px">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <button class="ib" data-a="auth-view" data-v="" aria-label="Voltar">${ic('back')}</button>
          <button class="a11y-btn-header" data-a="open-a11y-pre" aria-label="Acessibilidade" title="Acessibilidade">
            ${ic('a11y')}
          </button>
        </div>
        <h1 style="font-size:30px;margin:14px 0 4px">Criar conta</h1>
        <p style="color:var(--mut);margin:0 0 14px">Escolha seu perfil e preencha seus dados.</p>

        <label class="l">Tipo de perfil</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <button type="button" class="chip ${isP ? 'on' : ''}" aria-pressed="${isP}" data-a="reg-role" data-v="p" style="padding:10px;border-radius:12px">Sou paciente</button>
          <button type="button" class="chip ${!isP ? 'on' : ''}" aria-pressed="${!isP}" data-a="reg-role" data-v="f" style="padding:10px;border-radius:12px">Sou fisioterapeuta</button>
        </div>

        <label class="l" for="rn">Nome completo</label>
        <input class="in" id="rn" autocomplete="name" placeholder="Ex: Ana Silva" required>

        <label class="l" for="re">E-mail</label>
        <input class="in" id="re" type="email" autocomplete="email" inputmode="email" placeholder="seuemail@exemplo.com" required>

        <label class="l" for="rp">Senha (mínimo 6 caracteres)</label>
        <input class="in" id="rp" type="password" autocomplete="new-password" placeholder="Crie uma senha" required>

        ${!isP ? `
          <div style="margin:12px 0;background:var(--ice);padding:12px;border-radius:12px;border:1px solid var(--line)">
            <label class="l" style="margin-bottom:6px">Categoria profissional</label>
            <div style="display:flex;gap:12px">
              <label class="chk" style="margin:0"><input type="radio" name="subrole" data-a="reg-subrole" data-v="profissional" ${!isEstudante ? 'checked' : ''}> Fisioterapeuta formado(a)</label>
              <label class="chk" style="margin:0"><input type="radio" name="subrole" data-a="reg-subrole" data-v="estudante" ${isEstudante ? 'checked' : ''}> Sou estudante</label>
            </div>
          </div>

          ${!isEstudante ? `
            <label class="l" for="rc">Número do CREFITO</label>
            <input class="in" id="rc" placeholder="Ex: 123456-F" required>
            <span style="font-size:12px;color:var(--mut);display:block;margin-top:-6px;margin-bottom:8px">Sujeito a confirmação via API de validação profissional.</span>
          ` : `
            <label class="l" for="ri">Instituição de Ensino</label>
            <input class="in" id="ri" placeholder="Ex: Universidade Federal de Minas Gerais" required>
            <span style="font-size:12px;color:var(--mut);display:block;margin-top:-6px;margin-bottom:8px">Necessário comprovação posterior de vínculo acadêmico.</span>
          `}
        ` : ''}

        <div class="note" id="err" role="alert" aria-live="assertive" hidden></div>

        <button class="btn" data-a="do-register">Concluir cadastro</button>

        <div style="text-align:center;margin-top:14px">
          <span style="color:var(--mut);font-size:14px">Já possui uma conta? </span>
          <button data-a="auth-view" data-v="login" style="color:var(--bl);font-weight:700;font-size:14px;text-decoration:underline">Entrar</button>
        </div>

        <div class="note bl" style="margin-top:14px">${ic('info')}<span>Apenas fisioterapeutas com CREFITO aprovado podem realizar atendimentos e suporte via chat aos pacientes.</span></div>
      </main>`;
  },

  a11y: (isPreLogin = false) => `
    <header>
      <button class="ib" data-a="${isPreLogin ? 'close-a11y-pre' : 'back'}" aria-label="Voltar">${ic('back')}</button>
      <h1>Acessibilidade</h1>
    </header>
    <main id="main-content">
      <p style="color:var(--mut);margin:0 0 14px">Personalize o tamanho das letras, o contraste e as animações do aplicativo.</p>
      ${renderA11yControls()}
      <div class="note bl">${ic('info')}<span>Suas preferências ficam salvas automaticamente neste aparelho.</span></div>
    </main>`,

  perfil: () => {
    const u = ld('t_user', {});
    const isEstudante = S.role === 'f' && u.subRole === 'estudante';

    return H('Perfil') + `
      <main id="main-content">
        <div class="card">
          <span class="pill ${S.role === 'f' && !isEstudante ? 'o' : ''}" style="margin-bottom:6px">
            ${S.role === 'p' ? 'Conta Paciente' : isEstudante ? 'Conta Fisioterapeuta (Estudante)' : 'Conta Fisioterapeuta (CREFITO Ativo)'}
          </span><br>
          <b style="font-size:18px">${E(u.nome || '')}</b><br>
          <span style="color:var(--mut);font-size:14px">
            ${E(u.email || '')}
            ${u.crefito ? ' · CREFITO ' + E(u.crefito) : ''}
            ${u.instituicao ? ' · Instituição: ' + E(u.instituicao) : ''}
          </span>
          <p style="margin:8px 0 0;color:var(--mut);font-size:13px">
            ${isEstudante 
              ? 'Acesso acadêmico à busca de recursos e fichas científicas. O atendimento e suporte por chat aos pacientes é restrito a profissionais formados com CREFITO.' 
              : S.role === 'f' 
                ? 'Perfil profissional habilitado para consulta científica e atendimento via chat na barra inferior.' 
                : 'Seus registros e lembretes estão vinculados a esta conta.'}
          </p>
        </div>
        <button class="btn s" data-a="logout">Sair da conta</button>
        <button class="btn s" data-a="wipe">Apagar dados locais deste aparelho</button>
      </main>`;
  }
};

const ALL_VIEWS = { ...SharedViews, ...PatientViews, ...PhysioViews };

export function draw() {
  applyA11y();

  const scalePx = (str) => str.replace(/font-size:\s*(\d+(?:\.\d+)?)px/g, (_, px) => `font-size:${(px / 16).toFixed(3)}rem`);

  if (S.roleA11yPage) {
    A.innerHTML = scalePx(SharedViews.a11y(true));
    return;
  }

  const u0 = ld('t_user', null);

  if (!u0 || !u0.role) {
    if (S.authMode === 'login') {
      A.innerHTML = scalePx(SharedViews.login());
    } else if (S.authMode === 'register') {
      A.innerHTML = scalePx(SharedViews.register());
    } else {
      A.innerHTML = scalePx(SharedViews.welcome());
    }
    return;
  }

  S.role = u0.role;
  const r = S.role;
  const s = S.s;
  let viewKey = s;

  if (s === 'home') viewKey = r === 'p' ? 'home_p' : 'home_f';
  if (s === 'evo') viewKey = 'evo_p';

  const hasNav = !['tri', 'alerta', 'ori', 'feedback', 'cmp', 'ficha', 'chat-room', 'a11y'].includes(s);
  let html = ALL_VIEWS[viewKey] ? ALL_VIEWS[viewKey]() : '';
  html = html.replace('<main>', '<main id="main-content">');

  if (s === 'home') {
    const heroBtn = `<button class="a11y-btn-hero" data-a="open-a11y" aria-label="Acessibilidade" title="Acessibilidade">${ic('a11y')}</button>`;
    html = html.replace('<button class="bell"', `${heroBtn}<button class="bell"`);
  }

  const alarmBanner = S.activeAlarm ? `
    <div role="alert" aria-live="assertive" style="background:var(--navy);color:#fff;padding:12px 16px;border-bottom:3px solid var(--or);display:flex;align-items:center;justify-content:space-between;gap:10px;z-index:50">
      <div style="font-size:0.875rem">
        <b style="color:var(--or);display:block">Lembrete (${S.activeAlarm.h}): ${S.activeAlarm.k}</b>
        <span>${S.activeAlarm.obs ? E(S.activeAlarm.obs) : 'Hora da sua sessão de termoterapia.'}</span>
      </div>
      <div style="display:flex;gap:6px;flex:none">
        <button class="pill o" style="color:var(--navy)" data-a="alarm-open" data-k="${S.activeAlarm.k.toLowerCase()}">Iniciar</button>
        <button class="pill" style="background:rgba(255,255,255,0.2);color:#fff" data-a="alarm-dismiss">OK</button>
      </div>
    </div>` : '';

  A.innerHTML = scalePx(
    alarmBanner
    + html
    + (hasNav ? NAV(r) : '')
    + (S.toast ? `<div class="toast" role="status" aria-live="polite">${S.toast}</div>` : '')
  );
}

A.addEventListener('click', async (e) => {
  if (e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION' || e.target.closest('select')) {
    return;
  }

  const t = e.target.closest('[data-a]');
  if (!t) return;

  const a = t.dataset.a;
  const v = t.dataset.v;
  const k = t.dataset.k;

  if (a === 'open-a11y-pre') { S.roleA11yPage = true; draw(); return; }
  if (a === 'close-a11y-pre') { S.roleA11yPage = false; draw(); return; }
  if (a === 'open-a11y') { if (S.s !== 'a11y') go('a11y'); return; }
  if (a === 'a11y-font') { const cfg = getA11y(); cfg.font = v; sv('t_a11y', cfg); draw(); return; }
  if (a === 'a11y-contrast') { const cfg = getA11y(); cfg.contrast = v; sv('t_a11y', cfg); draw(); return; }
  if (a === 'a11y-motion') { const cfg = getA11y(); cfg.motion = v; sv('t_a11y', cfg); draw(); return; }

  if (a === 'auth-view') { S.authMode = v || null; draw(); return; }
  if (a === 'reg-role') { S.regRole = v; draw(); return; }
  if (a === 'reg-subrole') { S.regSubRole = v; draw(); return; }

  if (a === 'do-register') {
    const g = i => $(i) ? $(i).value.trim() : '';
    const nome = g('#rn');
    const email = g('#re');
    const senha = $('#rp') ? $('#rp').value : '';
    const crefito = g('#rc');
    const instituicao = g('#ri');
    const er = $('#err');

    let msg = '';
    if (!nome) msg = 'Informe seu nome completo.';
    else if (!/^\S+@\S+\.\S+$/.test(email)) msg = 'Informe um e-mail válido.';
    else if (senha.length < 6) msg = 'A senha deve ter pelo menos 6 caracteres.';
    else if (S.regRole === 'f') {
      if (S.regSubRole === 'profissional' && !crefito) msg = 'Informe o número do CREFITO.';
      if (S.regSubRole === 'estudante' && !instituicao) msg = 'Informe a instituição de ensino.';
    }

    if (msg) {
      er.textContent = msg;
      er.hidden = false;
      return;
    }

    const res = await authService.register({
      role: S.regRole,
      subRole: S.regRole === 'f' ? S.regSubRole : 'paciente',
      nome,
      email,
      senha,
      crefito,
      instituicao
    });

    if (!res.ok) {
      er.textContent = res.error;
      er.hidden = false;
      return;
    }

    S.role = res.user.role;
    sv('t_role', res.user.role);
    S.authMode = null;
    tab('home');
    say(`Bem-vindo(a), ${res.user.nome.split(' ')[0]}!`);
    return;
  }

  if (a === 'do-login') {
    const email = $('#le') ? $('#le').value.trim() : '';
    const senha = $('#lp') ? $('#lp').value : '';
    const er = $('#err');

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      er.textContent = 'Informe um e-mail válido.';
      er.hidden = false;
      return;
    }
    if (!senha) {
      er.textContent = 'Informe sua senha.';
      er.hidden = false;
      return;
    }

    const res = await authService.login({ email, senha });
    if (!res.ok) {
      er.textContent = res.error;
      er.hidden = false;
      return;
    }

    S.role = res.user.role;
    sv('t_role', res.user.role);
    S.authMode = null;
    tab('home');
    say(`Olá, ${res.user.nome.split(' ')[0]}!`);
    return;
  }

  if (a === 'logout') {
    stopTimer();
    await authService.logout();
    S.role = null;
    S.authMode = null;
    draw();
    return;
  }

  if (handlePhysioAction(a, v, k, e, draw)) return;
  if (handlePatientAction(a, v, k, draw)) return;

  if (a === 'tab') { stopTimer(); tab(v); }
  else if (a === 'back') { stopTimer(); back(); }
  else if (a === 'go') {
    if (v === 'tri') { S.qi = 0; S.ans = []; }
    if (v === 'ficha') go('ficha', { k });
    else go(v);
  }
  else if (a === 'bell') {
    if (S.role === 'p') tab('trat');
    else say('Sem novos alertas.');
  }
  else if (a === 'wipe') {
    ['t_reg', 't_fav', 't_lemb', 't_clin_reg', 't_chat', 't_ult', 't_ult_local', 't_a11y', 't_accounts', 't_patient_requests'].forEach(x => {
      try { localStorage.removeItem(x); } catch (err) {}
    });
    await authService.logout();
    S.role = null;
    S.authMode = null;
    draw();
  }
});

A.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.a === 'f-cond') {
    setTimeout(() => {
      S.p = { ...S.p, c: t.value, obj: 'todos' };
      draw();
    }, 50);
  }
  else if (t.dataset.a === 'f-obj') {
    setTimeout(() => {
      S.p = { ...S.p, obj: t.value };
      draw();
    }, 50);
  }
  else if (t.dataset.a === 'f-rec') {
    setTimeout(() => {
      S.p = { ...S.p, rec: t.value };
      draw();
    }, 50);
  }
  else if (t.dataset.a === 'cmp') {
    setTimeout(() => {
      S.p = { a: $('#ca').value, b: $('#cb').value };
      draw();
    }, 50);
  }
});

A.addEventListener('input', (e) => {
  if (e.target.dataset.a === 'dor') {
    S.p.d = +e.target.value;
    $('#dv').textContent = e.target.value;
  }
});

A.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.classList.contains('res')) e.target.click();
  if (e.key === 'Enter' && e.target.id === 'msg') e.target.nextElementSibling.click();
});

startReminderWatcher(draw);
draw();