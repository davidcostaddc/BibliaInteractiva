document.addEventListener("DOMContentLoaded", () => {
  const startModal = document.getElementById("startModal");
  const startBtn = document.getElementById("startBtn");
  const avatars = document.querySelectorAll(".avatar-img");
  const userNameInput = document.getElementById("userName");
  const profile = document.getElementById("profile");
  const profileName = document.getElementById("profileName");
  const profileAvatar = document.getElementById("profileAvatar");
  const toggleTheme = document.getElementById("toggleTheme");
  const progressText = document.getElementById("progressText");
  const progressFill = document.getElementById("progressFill");
  const main = document.querySelector("main");

  const profileModal = document.getElementById("profileModal");
  const closeProfileModal = document.getElementById("closeProfileModal");
  const modalAvatar = document.getElementById("modalAvatar");
  const modalName = document.getElementById("modalName");
  const modalProgressFill = document.getElementById("modalProgressFill");
  const modalProgressText = document.getElementById("modalProgressText");

  const mensagemModal = document.getElementById("mensagemModal");
  const mensagemScroll = document.getElementById("mensagemScroll");
  const fecharMensagem = document.getElementById("fecharMensagem");
  const jornadaText = document.getElementById("jornadaText");

  // Notificação elements
  const notifBox = document.getElementById("notif-conclusao");
  const notifTitle = document.getElementById("notif-title");
  const notifText = document.getElementById("notif-text");
  const notifOpenBtn = document.getElementById("notif-abrir");

  let selectedAvatar = avatars[0]?.src || "";
  let livrosLidos = JSON.parse(localStorage.getItem("livrosLidos")) || {};
  let userData = JSON.parse(localStorage.getItem("userData")) || null;
  let ultimaLeitura = JSON.parse(localStorage.getItem("ultimaLeitura")) || null;
  let bibleData = [];

  const bibleUrl = "acf.json";
  const totalLivros = 66;
  const otCount = 39; // índices 0..38 = Antigo
  const ntCount = 27; // 39..65 = Novo

  // Flags para evitar mostrar repetidamente (agora inclui total)
  let popupFlags = {
    otShown: JSON.parse(localStorage.getItem("otShown")) || false,
    ntShown: JSON.parse(localStorage.getItem("ntShown")) || false,
    totalShown: JSON.parse(localStorage.getItem("totalShown")) || false
  };

  // Tema escuro/claro
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleTheme.textContent = "☀️";
  }
  toggleTheme.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const dark = document.body.classList.contains("dark");
    toggleTheme.textContent = dark ? "☀️" : "🌙";
    localStorage.setItem("theme", dark ? "dark" : "light");
  });

  // Seleção de avatar
  avatars.forEach((a) => {
    a.addEventListener("click", () => {
      avatars.forEach((av) => av.classList.remove("active", "selected"));
      a.classList.add("active", "selected");
      selectedAvatar = a.src;
    });
  });

  // Iniciar
  startBtn.addEventListener("click", () => {
    const name = userNameInput.value.trim() || "Visitante";
    userData = { name, avatar: selectedAvatar };
    localStorage.setItem("userData", JSON.stringify(userData));
    atualizarPerfil();
    startModal.classList.remove("active");
    profile.setAttribute("aria-hidden", "false");
  });

  if (userData) {
    atualizarPerfil();
    startModal.classList.remove("active");
    profile.setAttribute("aria-hidden", "false");
  }

  function atualizarPerfil() {
    profileName.textContent = userData?.name || "Visitante";
    profileAvatar.innerHTML = userData?.avatar
      ? `<img src="${userData.avatar}" alt="Avatar" class="perfil-img">`
      : "📖";
    atualizarJornadaText();
  }

  async function carregarBiblia() {
    try {
      const resp = await fetch(bibleUrl);
      bibleData = await resp.json();
    } catch (e) {
      console.error("Erro ao carregar acf.json:", e);
    }
    montarPaginaInicial();
    inserirBotaoContinuar();
    atualizarProgresso();
  }

  carregarBiblia();

  // ------------------------------
  // Paletas por grupo (estante)
  // ------------------------------
  const coresPorGrupo = {
    Pentateuco: "#d49c3d",
    Historicos: "#497b40",
    Poeticos: "#b23b2b",
    Profetas: "#2b7a9e",
    Evangelhos: "#cc4b00",
    Atos: "#cc4b00",
    CartasDePaulo: "#587b33",
    OutrasCartas: "#46824e",
    Apocalipse: "#5a2b6f",
    Padrao: "#bfbfbf"
  };

  function obterCorLivro(nome) {
    if (!nome) return coresPorGrupo.Padrao;
    const n = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    if (["genesis","exodo","levitico","numeros","deuteronomio"].some(x => n.includes(x)))
      return coresPorGrupo.Pentateuco;

    const historicos = ["josue","juizes","rute","1 samuel","2 samuel","1 reis","2 reis",
      "1 cronicas","2 cronicas","esdras","neemias","ester"];
    if (historicos.some(x => n.includes(x))) return coresPorGrupo.Historicos;

    const poeticos = ["jo","salmos","prov","eclesiastes","cantares","cantico"];
    if (poeticos.some(x => n.includes(x))) return coresPorGrupo.Poeticos;

    const profetas = ["isaias","jeremias","lamentacoes","ezequiel","daniel","oseias","joel","amos","obadias","jonas","miqueias","naum","habacuque","sofonias","ageu","zacarias","malaquias"];
    if (profetas.some(x => n.includes(x))) return coresPorGrupo.Profetas;

    if (["mateus","marcos","lucas","joao","joão"].some(x => n.includes(x)))
      return coresPorGrupo.Evangelhos;

    if (n.includes("atos")) return coresPorGrupo.Atos;

    const paulo = ["romanos","corintios","coríntios","galatas","efesios","filipenses","colossenses",
      "tessalonicenses","timoteo","tito","filemom"];
    if (paulo.some(x => n.includes(x))) return coresPorGrupo.CartasDePaulo;

    const outras = ["hebreus","tiago","pedro","joao","joão","juda","judas"];
    if (outras.some(x => n.includes(x))) return coresPorGrupo.OutrasCartas;

    if (n.includes("apocalipse") || n.includes("revelation"))
      return coresPorGrupo.Apocalipse;

    return coresPorGrupo.Padrao;
  }

  // ==============================
  //   MONTAR PÁGINA INICIAL
  // ==============================
  function montarPaginaInicial() {
    main.innerHTML = `
      <section class="testamento">
        <h2>Antigo Testamento</h2>
        <div class="prateleira" id="antigo"></div>
      </section>
      <div class="divider"></div>
      <section class="testamento">
        <h2>Novo Testamento</h2>
        <div class="prateleira" id="novo"></div>
      </section>
    `;

    const antigo = document.getElementById("antigo");
    const novo = document.getElementById("novo");

    if (!bibleData || !bibleData.length) return;

    bibleData.forEach((book, i) => {
      const div = document.createElement("div");
      div.className = "livro-wrapper";

      const a = document.createElement("a");
      a.href = "#";
      a.className = "livro";
      a.textContent = book.name || `Livro ${i + 1}`;

      const isAntigo = i < otCount;
      const cor = obterCorLivro(book.name);

      if (cor === coresPorGrupo.Pentateuco) {
        a.style.background = cor;
      } else {
        a.style.background = `linear-gradient(145deg, ${cor}, ${shadeColor(cor, -12)})`;
      }

      a.style.color = "#fffbea";

      const chave = book.abbrev || book.name;
      if (chave && livrosLidos[chave]?.completo) a.classList.add("read");

      a.addEventListener("click", (e) => {
        e.preventDefault();
        mostrarCapitulos(book);
      });

      div.appendChild(a);
      isAntigo ? antigo.appendChild(div) : novo.appendChild(div);
    });

    inserirBotaoContinuar();
  }

  function shadeColor(hex, percent) {
    const h = hex.replace("#", "");
    if (h.length !== 6) return hex;
    const num = parseInt(h, 16);
    let r = (num >> 16) + Math.round(255 * (percent / 100));
    let g = ((num >> 8) & 0x00FF) + Math.round(255 * (percent / 100));
    let b = (num & 0x0000FF) + Math.round(255 * (percent / 100));

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
  }

  // ------------------------------
  // Botão continuar, capítulos, versículos
  // ------------------------------
  function inserirBotaoContinuar() {
    const existente = document.getElementById("btnContinuarLeitura");
    if (existente) existente.remove();
    if (!ultimaLeitura || !bibleData.length) return;

    const btn = document.createElement("button");
    btn.id = "btnContinuarLeitura";
    btn.className = "btn capitulo";

    const livroObj = bibleData.find(
      (b) => b.abbrev === ultimaLeitura.livro || b.name === ultimaLeitura.livro
    );
    const displayName = livroObj ? livroObj.name || livroObj.abbrev : ultimaLeitura.livro;

    if (displayName.toLowerCase().includes("salmos")) {
      btn.textContent = `📖 Continuar - Salmo ${ultimaLeitura.capitulo + 1}`;
    } else {
      btn.textContent = `📖 Continuar ${displayName} - Capítulo ${ultimaLeitura.capitulo + 1}`;
    }

    btn.addEventListener("click", () => {
      const livro = livroObj;
      if (!livro) return;
      mostrarVersiculos(livro, ultimaLeitura.capitulo);
    });

    main.insertBefore(btn, main.firstElementChild);
  }

  function mostrarCapitulos(book) {
    main.innerHTML = "";
    const voltarBtn = document.createElement("button");
    voltarBtn.className = "btn voltar";
    voltarBtn.textContent = "← Voltar";
    voltarBtn.addEventListener("click", montarPaginaInicial);
    main.appendChild(voltarBtn);

    const titulo = document.createElement("h2");
    titulo.textContent = book.name;
    titulo.style.textAlign = "center";
    main.appendChild(titulo);

    const capitulosDiv = document.createElement("div");
    capitulosDiv.className = "capitulos";
    capitulosDiv.style.display = "grid";
    capitulosDiv.style.gridTemplateColumns = "repeat(auto-fit, minmax(80px, 1fr))";
    capitulosDiv.style.justifyItems = "center";

    const chaptersCount = book.chapters?.length || 0;
    for (let i = 0; i < chaptersCount; i++) {
      const btn = document.createElement("button");
      btn.className = "btn capitulo";

      // Ajuste para Salmos
      if (book.name.toLowerCase().includes("salmos")) {
        btn.textContent = `Salmo ${i + 1}`;
      } else {
        btn.textContent = `Capítulo ${i + 1}`;
      }

      const chave = book.abbrev || book.name;
      if (chave && livrosLidos[chave]?.capitulos?.includes(i)) btn.classList.add("lido");
      btn.addEventListener("click", () => mostrarVersiculos(book, i));
      capitulosDiv.appendChild(btn);
    }

    main.appendChild(capitulosDiv);
  }

  // Função que adiciona botões de navegação quando mostramos versículos
  function montarNavCapitulos(book, cap) {
    // remove nav existente
    const existingNav = document.getElementById("navCapitulos");
    if (existingNav) existingNav.remove();

    const nav = document.createElement("div");
    nav.id = "navCapitulos";
    nav.style.display = "flex";
    nav.style.justifyContent = "center";
    nav.style.gap = "10px";
    nav.style.marginTop = "12px";

    const btnPrev = document.createElement("button");
    btnPrev.className = "btn voltar";
    btnPrev.textContent = book.name.toLowerCase().includes("salmos") ? "⏮ Voltar Salmo" : "⏮ Voltar Capítulo";
    btnPrev.addEventListener("click", () => {
      navegarCapitulo(book, cap, -1);
    });

    const btnNext = document.createElement("button");
    btnNext.className = "btn capitulo";
    // se for último capítulo do livro, transformar botão em "Próximo Livro"
    const chaptersCount = book.chapters?.length || 0;
    const isLastCap = (cap === chaptersCount - 1);

   if (isLastCap && book.name.toLowerCase() !== "apocalipse") {
    btnNext.textContent = "📖 Próximo Livro";
    btnNext.classList.add("proximo-livro");
} else if (!isLastCap) {
    btnNext.textContent = book.name.toLowerCase().includes("salmos") ? "⏭ Próximo Salmo" : "⏭ Próximo Capítulo";
} else {
    // último capítulo de Apocalipse -> não mostrar botão
    btnNext.style.display = "none";
}


    btnNext.addEventListener("click", (e) => {
      // se for último capítulo, animação + troca de livro
      if (isLastCap) {
        // animação dourada pulsante
        btnNext.classList.add("pulse-anim");
        // pequena transição no main para suavizar troca
        main.classList.add("fade-transition");
        setTimeout(() => {
          // navegar para próximo livro (delta +1)
          navegarCapitulo(book, cap, +1);
          // limpar animações depois
          btnNext.classList.remove("pulse-anim");
          setTimeout(()=> main.classList.remove("fade-transition"), 500);
        }, 700);
      } else {
        // navegar sem animação
        navegarCapitulo(book, cap, +1);
      }
    });

    nav.appendChild(btnPrev);
    nav.appendChild(btnNext);
    main.appendChild(nav);
  }

  // Navegação entre capítulos / livros
  function navegarCapitulo(book, cap, delta) {
    const currentIndex = bibleData.indexOf(book);
    if (currentIndex === -1) return;

    const chaptersCount = book.chapters?.length || 0;
    let novoCap = cap + delta;
    let novoLivroIndex = currentIndex;

    if (novoCap < 0) {
      // ir para livro anterior, último capítulo
      if (currentIndex > 0) {
        novoLivroIndex = currentIndex - 1;
        const livroAnterior = bibleData[novoLivroIndex];
        const totalCap = livroAnterior.chapters?.length || 0;
        mostrarVersiculos(livroAnterior, Math.max(0, totalCap - 1));
        return;
      } else {
        // já é o primeiro, nada a fazer
        return;
      }
    }

    if (novoCap >= chaptersCount) {
      // passar para o próximo livro (capítulo 0)
      if (currentIndex < bibleData.length - 1) {
        novoLivroIndex = currentIndex + 1;
        const proximoLivro = bibleData[novoLivroIndex];
        mostrarVersiculos(proximoLivro, 0);
        return;
      } else {
        // último capítulo do último livro
        marcarCapituloComoLido(book, cap);
        checarConclusoes(); // pode disparar popup final (agora notificação primeiro)
        return;
      }
    }

    // se ainda dentro do mesmo livro, só mostrar
    mostrarVersiculos(book, novoCap);
  }

  function mostrarVersiculos(book, cap) {
    main.innerHTML = "";
    const voltarBtn = document.createElement("button");
    voltarBtn.className = "btn voltar";
    voltarBtn.textContent = "← Voltar aos Capítulos";
    voltarBtn.addEventListener("click", () => mostrarCapitulos(book));
    main.appendChild(voltarBtn);

    const titulo = document.createElement("h2");
    if (book.name.toLowerCase().includes("salmos")) {
      titulo.textContent = `Salmo ${cap + 1}`;
    } else {
      titulo.textContent = `${book.name} — Capítulo ${cap + 1}`;
    }
    titulo.style.textAlign = "center";
    main.appendChild(titulo);

    const container = document.createElement("div");
    container.className = "capitulo-container";

    const texto = document.createElement("div");
    texto.className = "texto-biblia";

    const versiculos = book.chapters[cap] || [];
    versiculos.forEach((v, i) => {
      const p = document.createElement("p");
      p.innerHTML = `<strong>${i + 1}.</strong> ${v}`;
      texto.appendChild(p);
    });

    container.appendChild(texto);
    main.appendChild(container);

    // marcar capítulo como lido ao abrir
    marcarCapituloComoLido(book, cap);

    // montar nav com Prev/Next (com checagem de último capítulo)
    montarNavCapitulos(book, cap);
  }

  function marcarCapituloComoLido(book, cap) {
    const chave = book.abbrev || book.name;
    if (!chave) return;

    if (!livrosLidos[chave]) livrosLidos[chave] = { capitulos: [], completo: false };
    if (!livrosLidos[chave].capitulos.includes(cap)) livrosLidos[chave].capitulos.push(cap);

    if (book.chapters && livrosLidos[chave].capitulos.length === book.chapters.length)
      livrosLidos[chave].completo = true;

    localStorage.setItem("livrosLidos", JSON.stringify(livrosLidos));
    ultimaLeitura = { livro: chave, capitulo: cap };
    localStorage.setItem("ultimaLeitura", JSON.stringify(ultimaLeitura));
    atualizarProgresso();
  }

  function atualizarProgresso() {
    // Conta quantos livros realmente completos existem (limitado a totalLivros)
    const lidosArray = Object.values(livrosLidos).filter((b) => b.completo);
    let lidos = lidosArray.length;
    if (lidos > totalLivros) lidos = totalLivros;

    progressText.textContent = `${lidos} / ${totalLivros}`;
    const percent = Math.min((lidos / totalLivros) * 100, 100);
    progressFill.style.width = `${percent}%`;

    // atualiza modalPerfil também, se aberto
    if (modalProgressFill) modalProgressFill.style.width = `${percent}%`;
    if (modalProgressText) modalProgressText.textContent = `Progresso: ${progressText.textContent}`;

    // checar se alguma conclusão de testamento ou total ocorreu
    checarConclusoes();
  }

  // Checa se OT/NT/Total foram concluídos e mostra NOTIFICAÇÃO primeiro
  function checarConclusoes() {
    const keys = Object.keys(livrosLidos);
    let otCompleted = 0;
    let ntCompleted = 0;
    keys.forEach((k) => {
      if (livrosLidos[k].completo) {
        const idx = bibleData.findIndex(b => (b.abbrev === k || b.name === k));
        if (idx !== -1) {
          if (idx < otCount) otCompleted++;
          else ntCompleted++;
        }
      }
    });

    // TOTAL concluído?
    const totalCompleted = Object.values(livrosLidos).filter(b => b.completo).length;

    // Se completou todo o Novo Testamento (27) e ainda não mostramos NT notification
    if (ntCompleted >= ntCount && !popupFlags.ntShown && totalCompleted < totalLivros) {
      mostrarNotificacao('nt');
      popupFlags.ntShown = true;
      localStorage.setItem('ntShown', true);
    }

    // Se completou todo o Velho Testamento (39) e ainda não mostramos OT notification
    if (otCompleted >= otCount && !popupFlags.otShown && totalCompleted < totalLivros) {
      mostrarNotificacao('ot');
      popupFlags.otShown = true;
      localStorage.setItem('otShown', true);
    }

    // Se completou toda a Bíblia
    if (totalCompleted >= totalLivros && !popupFlags.totalShown) {
      mostrarNotificacao('total');
      popupFlags.totalShown = true;
      localStorage.setItem('totalShown', true);
    }
  }

  // Mensagens de texto pedidas por você (mantive o conteúdo original)
  const textos = {
    nt: {
      title: "📜 Reflexão: A Jornada Concluída do Novo Testamento",
      body: `
        <p>Parabéns mais uma vez por ter percorrido toda a coleção de livros que compõem o Novo Testamento! Ao concluir esta leitura, você não apenas terminou um livro; você completou uma jornada transformadora que conecta a vida, os ensinamentos e o sacrifício de Jesus Cristo com a fundação e a esperança da fé cristã.</p>
        <p class="section-title">O Que Você Testemunhou:</p>
        <p><strong>A Plenitude da Vida:</strong> Nos Evangelhos (Mateus, Marcos, Lucas e João), você testemunhou a humanidade e a divindade de Cristo, seus milagres, suas parábolas e, acima de tudo, seu mandamento central de amor.</p>
        <p><strong>O Poder da Missão:</strong> Em Atos dos Apóstolos, você viu como o Espírito Santo capacitou um pequeno grupo de discípulos a levar a mensagem do evangelho a "toda a Judeia, Samaria e até os confins da terra."</p>
        <p><strong>A Profundidade da Doutrina:</strong> Nas Epístolas (as cartas de Paulo, Pedro, Tiago, etc.), você estudou a aplicação prática e teológica da fé.</p>
        <p><strong>A Esperança Final:</strong> No Apocalipse, você contemplou a visão final da história, a promessa da vitória definitiva do bem sobre o mal, e a esperança de um novo céu e uma nova terra.</p>
        <blockquote>O Novo Testamento não é apenas um registro histórico; é uma mensagem viva. A verdadeira conclusão desta leitura não é fechar o livro, mas sim abrir a sua própria vida para que os princípios, o amor e a graça que você absorveu possam ser manifestados em suas ações diárias.</blockquote>
      `
    },
    ot: {
      title: "🥳 Parabéns! Você Concluiu o Velho Testamento",
      body: `
        <p>Esta é uma conquista monumental! Ao concluir o Velho Testamento, você demonstrou perseverança e dedicação admiráveis ao percorrer os 39 livros que formam a fundação da Bíblia.</p>
        <p class="section-title">Ao concluir o Velho Testamento, você:</p>
        <p><strong>Conheceu as Origens:</strong> Viu a Criação, a Queda, o Dilúvio e o estabelecimento da Aliança de Deus com a humanidade.</p>
        <p><strong>Compreendeu a História:</strong> Percorreu a formação de Israel, a Lei de Moisés, a era dos Reis e a sabedoria de Salmos e Provérbios.</p>
        <p><strong>Desvendou as Profecias:</strong> Entendeu a voz dos profetas que apontaram para o Messias.</p>
        <blockquote>Você não leu apenas um livro; você absorveu a história de amor e redenção de Deus com Seu povo ao longo de milênios.</blockquote>
      `
    },
    total: {
      title: "👑 Mensagem de Triunfo: A Coroa da Leitura Completa",
      body: `
        <p>PARABÉNS! Você concluiu a leitura de TODA a Bíblia, a Palavra de Deus! Você demonstrou fidelidade e sede de conhecimento que são verdadeiramente inspiradoras.</p>
        <p class="section-title">O Que Você Conquistou:</p>
        <p><strong>A Visão Completa:</strong> Você viu o plano divino se desenrolar, desde a Criação (Gênesis) até a Consumação (Apocalipse).</p>
        <p><strong>A Harmonia da Revelação:</strong> As leis, profecias e histórias do Velho Testamento são as raízes, e o Novo Testamento é o florescer e o cumprimento em Jesus Cristo.</p>
        <p><strong>Um Tesouro de Sabedoria:</strong> Você absorveu poesia, história, ética, doutrina e a promessa inabalável da esperança.</p>
        <blockquote>A verdadeira beleza desta conclusão é que a leitura não termina aqui, ela começa a ser vivida. Que a luz de toda a Escritura que você internalizou guie seus passos.</blockquote>
        <p style="margin-top:12px; font-weight:800; color:#fffdfa;">Ao fechar esta mensagem, seu progresso será zerado automaticamente e sua <strong>Jornada Bíblica Total</strong> será incrementada em 1.</p>
      `
    }
  };

  // Exibe notificação estilizada conforme tipo: 'ot', 'nt', 'total'
  function mostrarNotificacao(tipo) {
    if (!notifBox) return;

    // Títulos e textos curtos para a notificação
    const mapping = {
      ot: {
        title: "🕊️ Parabéns! Velho Testamento Concluído!",
        text: "Você Completou o Velho Testamento. Clique para refletir."
      },
      nt: {
        title: "📜 Parabéns! Novo Testamento Concluído! ",
        text: "Você completou o Novo Testamento. Clique para refletir."
      },
      total: {
        title: "🏆 Parabéns! Toda a Bíblia Concluída!",
        text: "Você concluiu toda a Bíblia. Clique para ver a celebração."
      }
    };

    const data = mapping[tipo] || mapping.ot;
    notifTitle.textContent = data.title;
    notifText.textContent = data.text;
    notifBox.classList.add("show");
    notifBox.setAttribute("aria-hidden", "false");

    // Abre modal com a mensagem completa ao clicar no botão
    const abrir = () => {
      notifBox.classList.remove("show");
      notifBox.setAttribute("aria-hidden", "true");
      mostrarMensagemFinal(tipo);
    };

    // ligar eventos (removendo handlers antigos para evitar duplicação)
    notifOpenBtn.onclick = abrir;
    notifBox.onclick = (e) => {
      // se clicar fora do botão, também abre (UX: clique em qualquer área)
      if (e.target === notifBox) abrir();
    };

    // remove automaticamente após 10s se não clicado
   const notif = document.getElementById("notif-conclusao");
notif.classList.add("show");

  }

  // Exibe modal estilizado conforme tipo: 'ot', 'nt', 'total'
  function mostrarMensagemFinal(tipo) {
    if (!mensagemModal || !mensagemScroll) return;
    mensagemScroll.innerHTML = `<h2>${textos[tipo].title}</h2>${textos[tipo].body}`;
    mensagemModal.style.display = "flex";
    mensagemModal.classList.add("active");
    mensagemModal.setAttribute("aria-hidden", "false");

    // Handler para fechar
    fecharMensagem.onclick = () => {
      mensagemModal.style.display = "none";
      mensagemModal.classList.remove("active");
      mensagemModal.setAttribute("aria-hidden", "true");

      // caso seja total -> zerar progresso e incrementar jornada
      if (tipo === 'total') {
        incrementarJornadaEResetar();
      }
    };
  }

  // incrementar jornada e resetar progresso
  function incrementarJornadaEResetar() {
    const current = parseInt(localStorage.getItem("jornadaCount") || "0", 10) || 0;
    const novo = current + 1;
    localStorage.setItem("jornadaCount", novo);
    // reset progress
    livrosLidos = {};
    ultimaLeitura = null;
    localStorage.removeItem("livrosLidos");
    localStorage.removeItem("ultimaLeitura");
    // reset popup flags
    popupFlags = { otShown: false, ntShown: false, totalShown: false };
    localStorage.removeItem('otShown');
    localStorage.removeItem('ntShown');
    localStorage.removeItem('totalShown');
    atualizarJornadaText();
    montarPaginaInicial();
    atualizarProgresso();
  }

  function atualizarJornadaText() {
    const count = parseInt(localStorage.getItem("jornadaCount") || "0", 10) || 0;
    if (jornadaText) {
      jornadaText.textContent = `Jornada Bíblica Total: ${count}`;
    }
  }

  // Profile modal events
  profile.addEventListener("click", () => {
    modalAvatar.src = userData?.avatar || "";
    modalName.textContent = userData?.name || "Visitante";
    modalProgressFill.style.width = progressFill.style.width;
    modalProgressText.textContent = `Progresso: ${progressText.textContent}`;
    profileModal.classList.add("active");
  });

  closeProfileModal.addEventListener("click", () => {
    profileModal.classList.remove("active");
  });

  profileModal.addEventListener("click", (e) => {
    if (e.target === profileModal) profileModal.classList.remove("active");
  });

  // fechando mensagem ao clicar fora
  if (mensagemModal) {
    mensagemModal.addEventListener("click", (e) => {
      if (e.target === mensagemModal) {
        mensagemModal.style.display = "none";
        mensagemModal.classList.remove("active");
        mensagemModal.setAttribute("aria-hidden", "true");
      }
    });
  }

});
