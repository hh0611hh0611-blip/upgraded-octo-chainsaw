// シンプルなフロント実装（localStorage）
const DAN_LEVELS = ["初段","弐段","参段","四段","五段","六段","七段","八段","九段","皆伝"];

// 初期曲データ（サンプル）
const DEFAULT_SONGS = [
  { id: "s1", title: "疾風の譜面", dan: "初段", threshold: 70 },
  { id: "s2", title: "紅蓮の一打", dan: "弐段", threshold: 75 },
  { id: "s3", title: "蒼天の舞", dan: "参段", threshold: 78 },
  { id: "s4", title: "皆伝チャレンジ", dan: "皆伝", threshold: 92 }
];

const LS_KEYS = { SONGS: "dd_songs_v1", SCORES: "dd_scores_v1" };

function $(id){return document.getElementById(id)}

// 初期化
function init(){
  setupNav();
  loadOrInitData();
  renderDanCards();
  renderSongList();
  renderDanInAdmin();
  renderLeaderboard();
  setupAdminForm();
  setupReset();
  setupModalClose();
}

function setupNav(){
  const tabs = ["home","songs","ranks","admin"];
  tabs.forEach(t=>{
    $( "nav-" + t).addEventListener("click", ()=> {
      tabs.forEach(x=>$(x).classList.add("hidden"));
      tabs.forEach(x=>document.getElementById("nav-"+x).classList.remove("active"));
      $(t).classList.remove("hidden");
      $( "nav-" + t).classList.add("active");
    });
  });
}

// Data
function loadOrInitData(){
  if(!localStorage.getItem(LS_KEYS.SONGS)) localStorage.setItem(LS_KEYS.SONGS, JSON.stringify(DEFAULT_SONGS));
  if(!localStorage.getItem(LS_KEYS.SCORES)) localStorage.setItem(LS_KEYS.SCORES, JSON.stringify([]));
}

function getSongs(){ return JSON.parse(localStorage.getItem(LS_KEYS.SONGS) || "[]"); }
function saveSongs(s){ localStorage.setItem(LS_KEYS.SONGS, JSON.stringify(s)); renderSongList(); renderDanCards(); renderDanInAdmin(); }
function getScores(){ return JSON.parse(localStorage.getItem(LS_KEYS.SCORES) || "[]"); }
function saveScore(score){ const arr = getScores(); arr.push(score); localStorage.setItem(LS_KEYS.SCORES, JSON.stringify(arr)); renderLeaderboard(); }

// UI: 段位カード
function renderDanCards(){
  const container = $("dan-cards");
  container.innerHTML = "";
  DAN_LEVELS.forEach(d=>{
    const card = document.createElement("div"); card.className = "card";
    card.innerHTML = `<h4>${d}</h4><p>この段位の課題曲を挑戦して記録しよう。</p><p><button class="button" data-dan="${d}">曲を見る</button></p>`;
    container.appendChild(card);
  });
  container.querySelectorAll(".button").forEach(b=>{
    b.addEventListener("click", e=>{
      const dan = e.currentTarget.dataset.dan;
      document.getElementById("nav-songs").click();
      // 曲一覧で該当段位にスクロール
      setTimeout(()=>{
        const el = document.querySelector(`.song[data-dan="${dan}"]`);
        if(el){ el.scrollIntoView({behavior:"smooth",block:"center"}); el.classList.add("pulse"); setTimeout(()=>el.classList.remove("pulse"),1200); }
      },150);
    });
  });
}

// UI: 曲一覧
function renderSongList(){
  const list = $("song-list");
  const songs = getSongs();
  if(songs.length===0){ list.innerHTML="<p>曲が登録されていません。</p>"; return; }
  list.innerHTML = "";
  songs.forEach(s=>{
    const el = document.createElement("div"); el.className="song"; el.dataset.dan = s.dan;
    el.innerHTML = `<div>
        <strong>${s.title}</strong><div class="muted">段位: ${s.dan}  合格:${s.threshold}%</div>
      </div>
      <div>
        <button class="button start" data-id="${s.id}">挑戦</button>
      </div>`;
    list.appendChild(el);
  });
  list.querySelectorAll(".start").forEach(btn=>{
    btn.addEventListener("click", ()=> openChallengeModal(btn.dataset.id));
  });
}

// モーダル：挑戦
function openChallengeModal(songId){
  const songs = getSongs();
  const s = songs.find(x=>x.id===songId);
  if(!s) return alert("曲が見つかりません。");
  $("modal-title").textContent = `挑戦 — ${s.title}`;
  $("modal-body").innerHTML = `
    <p>段位: <strong>${s.dan}</strong></p>
    <label>プレイヤー名：<input id="in-player" value="名無し" /></label>
    <label>達成率（%）：<input id="in-score" type="number" min="0" max="100" value="0" /></label>
    <label>メモ：<input id="in-note" placeholder="例：フルコン逃した…" /></label>
    <div style="margin-top:10px"><button id="save-score" class="button">保存して判定</button></div>
  `;
  $("modal").classList.remove("hidden");
  $("save-score").addEventListener("click", ()=>{
    const player = $("in-player").value.trim() || "名無し";
    const val = Number($("in-score").value) || 0;
    const note = $("in-note").value || "";
    const pass = val >= s.threshold;
    const record = { id: `rec_${Date.now()}`, songId:s.id, title:s.title, dan:s.dan, player, val, pass, note, ts: new Date().toISOString() };
    saveScore(record);
    alert(`${player} — ${s.title}\n達成率：${val}%\n${pass ? "合格！":"不合格..."}`);
    $("modal").classList.add("hidden");
  });
}

function setupModalClose(){
  $("close-modal").addEventListener("click", ()=> $("modal").classList.add("hidden"));
  $("modal").addEventListener("click", (e)=>{ if(e.target === $("modal")) $("modal").classList.add("hidden"); });
}

// ランキング表示
function renderLeaderboard(){
  const lb = $("leaderboard");
  const scores = getScores().sort((a,b)=> b.val - a.val).slice(0,50);
  if(scores.length===0){ lb.innerHTML="<p>まだ記録がありません。</p>"; return; }
  lb.innerHTML = "";
  scores.forEach((r,i)=>{
    const div = document.createElement("div"); div.className="lb-item";
    div.innerHTML = `<div><strong>${i+1}. ${r.title}</strong><div class="muted">${r.player} — ${new Date(r.ts).toLocaleString()}</div></div><div><strong>${r.val}%</strong><div class="muted">${r.pass ? "合格":"不合格"}</div></div>`;
    lb.appendChild(div);
  });
}

// 管理フォーム
function renderDanInAdmin(){
  const sel = $("song-dan");
  sel.innerHTML = "";
  DAN_LEVELS.forEach(d=>{ const opt = document.createElement("option"); opt.value = d; opt.textContent = d; sel.appendChild(opt); });
}
function setupAdminForm(){
  $("add-song-form").addEventListener("submit", (e)=>{
    e.preventDefault();
    const title = $("song-title").value.trim();
    const dan = $("song-dan").value;
    const threshold = Number($("pass-threshold").value);
    if(!title) return alert("曲名を入力してください。");
    const id = "s" + Date.now();
    const arr = getSongs();
    arr.push({ id, title, dan, threshold });
    saveSongs(arr);
    $("song-title").value = "";
    alert("曲を追加しました！");
  });
}

function setupReset(){
  $("reset-data").addEventListener("click", ()=>{
    if(!confirm("ローカルデータを初期化します。よろしいですか？")) return;
    localStorage.removeItem(LS_KEYS.SONGS);
    localStorage.removeItem(LS_KEYS.SCORES);
    loadOrInitData();
    renderSongList();
    renderLeaderboard();
    renderDanCards();
    renderDanInAdmin();
    alert("初期化しました。");
  });
}

init();
