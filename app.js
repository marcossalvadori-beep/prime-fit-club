// ============================
// 1) CONFIGURAÇÃO DO SUPABASE
// ============================
// Substitua pelos valores do seu projeto Supabase
const SUPABASE_URL ="https://mgyqvuxeecmfdcmlmtac.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neXF2dXhlZWNtZmRjbWxtdGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODUxMjYsImV4cCI6MjA4NDE2MTEyNn0.UWwTXGcVTTxE1YeSCFEvLu22peI2Rc6-ZFqU6Uf4bi8";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);



// ============================
// 2) LINKS DE PAGAMENTO (MERCADO PAGO OU OUTRO)
// ============================
// Defina aqui seus links de pagamento. Esses links podem ser do Mercado Pago, Hotmart, etc.
const PAY_LINKS = {
  monthly:"https://mpago.la/28D3VGe",
  quarter:"https://mpago.la/14GqzKM",
  year:"https://mpago.la/1dBzLfJ",
  renew:"https://mpago.la/28D3VGe"
};

// ============================
// 3) CATÁLOGO DE TREINOS (MVP)
// ============================
// Depois você pode substituir por dados dinâmicos vindos do banco de dados.
const WORKOUTS = [
  { id: "iniciante_a", title: "Iniciante • Treino A", desc: "Corpo todo • base técnica", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "iniciante_b", title: "Iniciante • Treino B", desc: "Corpo todo • progressão simples", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "emag_a", title: "Emagrecimento • Treino A", desc: "Metabólico • seguro", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
  { id: "hiper_a", title: "Hipertrofia • Treino A", desc: "Força e volume", video: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
];

// ============================
// 4) ELEMENTOS DA UI
// ============================
const $ = (id) => document.getElementById(id);

const screens = {
  home: $("screenHome"),
  login: $("screenLogin"),
  signup: $("screenSignup"),
  dash: $("screenDashboard"),
  paywall: $("screenPaywall")
};

const loginMsg = $("loginMsg");
const signupMsg = $("signupMsg");
const paywallMsg = $("paywallMsg");

const userLine = $("userLine");
const subStatus = $("subStatus");
const workoutsGrid = $("workoutsGrid");

// ============================
// 5) NAVEGAÇÃO ENTRE TELAS
// ============================
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ============================
// 6) HELPER FUNCTIONS
// ============================
function setMsg(el, msg) {
  el.textContent = msg || "";
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isSubscriptionActive(profile) {
  if (!profile) return false;
  if (profile.subscription_status !== "active") return false;
  if (!profile.subscription_until) return false;
  return profile.subscription_until >= todayISO();
}

// ============================
// 7) RENDERIZAR TREINOS
// ============================
function renderWorkouts() {
  workoutsGrid.innerHTML = "";
  WORKOUTS.forEach((w) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
      <h3>${w.title}</h3>
      <p class="lead">${w.desc}</p>
      <button class="btn full" data-open="${w.id}">Abrir treino</button>
      <div class="hidden" id="vid_${w.id}" style="margin-top:12px;">
        <iframe
          width="100%" height="220"
          style="border-radius:16px;border:1px solid rgba(255,255,255,.12);"
          src="${w.video}"
          title="${w.title}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen>
        </iframe>
        <div style="margin-top:10px;color:rgba(255,255,255,.7);font-size:13px;">
          Exemplo (trocar depois): 4 exercícios • 3 séries • 8-12 reps • RIR 2
        </div>
      </div>
    `;
    workoutsGrid.appendChild(div);
  });
  workoutsGrid.querySelectorAll("button[data-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open");
      const box = document.getElementById(`vid_${id}`);
      box.classList.toggle("hidden");
      btn.textContent = box.classList.contains("hidden") ? "Abrir treino" : "Fechar treino";
    });
  });
}

// ============================
// 8) PERFIL DO USUÁRIO
// ============================
async function getMyProfile(userId) {
  const { data, error } = await supabaseClient
    .from("profiles")
    .select("id, full_name, subscription_status, subscription_until, email")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

async function ensureProfile(user) {
  const existing = await getMyProfile(user.id);
  if (existing) return existing;
  const { data, error } = await supabaseClient
    .from("profiles")
    .insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || "Aluno",
      email: user.email,
      subscription_status: "expired",
      subscription_until: null
    })
    .select()
    .single();
  if (error) return null;
  return data;
}

// ============================
// 9) AUTENTICAÇÃO
// ============================
async function signUp(name, email, password) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

// ============================
// 10) GATE: DASHBOARD OU PAYWALL
// ============================
async function routeAfterAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.user) {
    showScreen("home");
    return;
  }
  const profile = await ensureProfile(session.user);
  const name = profile?.full_name || session.user.email;
  userLine.textContent = `Logado como: ${name} • ${session.user.email}`;
  if (isSubscriptionActive(profile)) {
    subStatus.textContent = `✅ Acesso ativo até: ${profile.subscription_until}`;
    renderWorkouts();
    showScreen("dash");
  } else {
    paywallMsg.textContent = `Status: ${profile?.subscription_status || "expired"} • Sem acesso ativo`;
    showScreen("paywall");
  }
}

// ============================
// 11) EVENTOS DE UI
// ============================
document.addEventListener("DOMContentLoaded", () => {
  // Define ano atual no rodapé
  $("year").textContent = new Date().getFullYear();
  // Navegação
  $("btnGoLogin").addEventListener("click", () => showScreen("login"));
  $("btnGoSignup").addEventListener("click", () => showScreen("signup"));
  $("btnHomeStart").addEventListener("click", () => showScreen("signup"));
  $("btnToSignup").addEventListener("click", () => showScreen("signup"));
  $("btnToLogin").addEventListener("click", () => showScreen("login"));
  $("btnBackHome").addEventListener("click", () => showScreen("home"));
  // Botões de plano: abre link de pagamento
  $("btnBuyMonthly").addEventListener("click", () => window.location.href = PAY_LINKS.monthly);
  $("btnBuyQuarter").addEventListener("click", () => window.location.href = PAY_LINKS.quarter);
  $("btnBuyYear").addEventListener("click", () => window.location.href = PAY_LINKS.year);
  $("btnRenew").addEventListener("click", () => window.location.href = PAY_LINKS.renew);
  // Form login
  $("formLogin").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(loginMsg, "");
    try {
      const email = $("loginEmail").value.trim();
      const pass = $("loginPassword").value.trim();
      await signIn(email, pass);
      await routeAfterAuth();
    } catch (err) {
      setMsg(loginMsg, `Erro: ${err.message}`);
    }
  });
  // Form signup
  $("formSignup").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg(signupMsg, "");
    try {
      const name = $("signupName").value.trim();
      const email = $("signupEmail").value.trim();
      const pass = $("signupPassword").value.trim();
      await signUp(name, email, pass);
      setMsg(signupMsg, "Conta criada! Agora faça login.");
      showScreen("login");
    } catch (err) {
      setMsg(signupMsg, `Erro: ${err.message}`);
    }
  });
  // Logout
  $("btnLogout").addEventListener("click", async () => {
    await signOut();
    showScreen("home");
  });
  // Mudanças de sessão
  supabaseClient.auth.onAuthStateChange(async () => {
    await routeAfterAuth();
  });
  // Inicialização
  routeAfterAuth();
});
