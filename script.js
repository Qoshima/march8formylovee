const config = {
  photos: [
    { src: "assets/photos/photo01.jpg", alt: "Вы вместе, счастливый момент", caption: "Подпись к фото №1", portrait: true },
    { src: "assets/photos/photo02.jpg", alt: "Тёплая прогулка вдвоём", caption: "Подпись к фото №2", portrait: true },
    { src: "assets/photos/photo03.jpg", alt: "Улыбка любимой девушки", caption: "Подпись к фото №3" },
    { src: "assets/photos/photo04.jpg", alt: "Объятия и нежность", caption: "Подпись к фото №4" },
    { src: "assets/photos/photo05.jpg", alt: "Красивый совместный кадр", caption: "Подпись к фото №5" },
    { src: "assets/photos/photo06.jpg", alt: "Светлый день вместе", caption: "Подпись к фото №6" },
    { src: "assets/photos/photo07.jpg", alt: "Смех и радость", caption: "Подпись к фото №7" },
    { src: "assets/photos/photo08.jpg", alt: "Вечерняя романтика", caption: "Подпись к фото №8" },
    { src: "assets/photos/photo09.jpg", alt: "Незабываемое свидание", caption: "Подпись к фото №9", portrait: true },
    { src: "assets/photos/photo10.jpg", alt: "Нежный взгляд", caption: "Подпись к фото №10", portrait: true },
    { src: "assets/photos/photo11.jpg", alt: "Ваш особенный момент", caption: "Подпись к фото №11" },
    { src: "assets/photos/photo12.jpg", alt: "Счастливые воспоминания", caption: "Подпись к фото №12" }
  ],
  uiText: {
    openStory: "Открыть историю",
    replay: "Смотреть заново",
    musicOn: "Музыка: вкл",
    musicOff: "Музыка: выкл",
    enableMusic: "Включить музыку",
    postcardOpen: "Открытка открыта",
    postcardClosed: "Открытка закрыта"
  },
  music: {
    src: "assets/audio/love-theme.mp3",
    autoplayAttempt: true,
    loop: true,
    volume: 0.42
  },
  theme: {
    // Optional overrides, for example:
    // "--color-rose": "#cb7b8f"
  }
};

const elements = {
  root: document.documentElement,
  hero: document.getElementById("hero"),
  moments: document.getElementById("moments"),
  momentsGrid: document.getElementById("momentsGrid"),
  postcard: document.getElementById("postcard"),
  finale: document.getElementById("finale"),
  postcardCard: document.getElementById("postcardCard"),
  openStoryBtn: document.getElementById("openStoryBtn"),
  replayBtn: document.getElementById("replayBtn"),
  musicToggle: document.getElementById("musicToggle"),
  bgMusic: document.getElementById("bgMusic"),
  musicPrompt: document.getElementById("musicPrompt"),
  musicPromptBtn: document.getElementById("musicPromptBtn"),
  scrollHintBtn: document.getElementById("scrollHintBtn")
};

const state = {
  musicEnabled: false,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  parallaxRAF: 0
};

function applyThemeOverrides() {
  Object.entries(config.theme || {}).forEach(([token, value]) => {
    elements.root.style.setProperty(token, value);
  });
}

function preloadKeyPhotos(limit = 2) {
  config.photos.slice(0, limit).forEach((photo) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = photo.src;
    document.head.appendChild(link);
  });
}

function renderPhotos() {
  const fragment = document.createDocumentFragment();

  config.photos.forEach((photo, index) => {
    const article = document.createElement("article");
    article.className = "moment-card reveal";
    article.dataset.reveal = "";
    if (photo.portrait) {
      article.classList.add("moment-card--portrait");
    }

    const figure = document.createElement("figure");
    figure.className = "moment-card__media";

    const image = document.createElement("img");
    image.src = photo.src;
    image.alt = photo.alt;
    image.loading = index < 2 ? "eager" : "lazy";
    image.decoding = "async";
    figure.append(image);

    const content = document.createElement("div");
    content.className = "moment-card__content";

    const count = document.createElement("p");
    count.className = "moment-card__count";
    count.textContent = `Момент ${String(index + 1).padStart(2, "0")}`;

    const caption = document.createElement("p");
    caption.className = "moment-card__caption";
    caption.textContent = photo.caption || "";

    content.append(count, caption);
    article.append(figure, content);
    fragment.append(article);
  });

  elements.momentsGrid.replaceChildren(fragment);
}

function setupRevealObserver() {
  const revealTargets = document.querySelectorAll("[data-reveal]");

  if (state.reducedMotion) {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -7% 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

function updateMusicUI() {
  elements.musicToggle.textContent = state.musicEnabled ? config.uiText.musicOn : config.uiText.musicOff;
  elements.musicToggle.setAttribute("aria-pressed", String(state.musicEnabled));
}

async function enableMusic() {
  try {
    await elements.bgMusic.play();
    state.musicEnabled = true;
    elements.musicPrompt.hidden = true;
  } catch {
    state.musicEnabled = false;
    elements.musicPrompt.hidden = false;
  } finally {
    updateMusicUI();
  }
}

function disableMusic() {
  elements.bgMusic.pause();
  elements.bgMusic.currentTime = 0;
  state.musicEnabled = false;
  updateMusicUI();
}

function setupMusic() {
  elements.bgMusic.src = config.music.src;
  elements.bgMusic.loop = Boolean(config.music.loop);
  elements.bgMusic.volume = Number(config.music.volume ?? 0.4);

  updateMusicUI();
  elements.musicPromptBtn.textContent = config.uiText.enableMusic;

  if (config.music.autoplayAttempt) {
    enableMusic();
  }

  elements.musicToggle.addEventListener("click", async () => {
    if (state.musicEnabled) {
      disableMusic();
      return;
    }

    await enableMusic();
  });

  elements.musicPromptBtn.addEventListener("click", enableMusic);
}

function setupPostcardInteraction() {
  elements.postcardCard.addEventListener("click", () => {
    const opened = elements.postcardCard.classList.toggle("is-open");
    elements.postcardCard.setAttribute("aria-expanded", String(opened));
    elements.postcardCard.setAttribute("aria-label", opened ? config.uiText.postcardOpen : config.uiText.postcardClosed);
  });
}

function setupNavigationButtons() {
  elements.openStoryBtn.textContent = config.uiText.openStory;
  elements.replayBtn.textContent = config.uiText.replay;

  elements.openStoryBtn.addEventListener("click", () => {
    elements.moments.scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "start" });
  });

  elements.scrollHintBtn.addEventListener("click", () => {
    elements.moments.scrollIntoView({ behavior: state.reducedMotion ? "auto" : "smooth", block: "start" });
  });

  elements.replayBtn.addEventListener("click", () => {
    elements.postcardCard.classList.remove("is-open");
    elements.postcardCard.setAttribute("aria-expanded", "false");
    elements.postcardCard.setAttribute("aria-label", config.uiText.postcardClosed);

    document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.remove("is-visible"));
    window.scrollTo({ top: 0, behavior: state.reducedMotion ? "auto" : "smooth" });

    setTimeout(() => setupRevealObserver(), 160);
  });
}

function setupParallaxLite() {
  if (state.reducedMotion) {
    return;
  }

  const cards = () => document.querySelectorAll(".moment-card");

  const onScroll = () => {
    if (state.parallaxRAF) {
      return;
    }

    state.parallaxRAF = window.requestAnimationFrame(() => {
      cards().forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const viewportMiddle = window.innerHeight / 2;
        const distance = (rect.top + rect.height / 2 - viewportMiddle) / window.innerHeight;
        const offset = Math.max(-8, Math.min(8, -distance * (8 + (index % 3))));
        card.style.setProperty("--parallax", `${offset.toFixed(2)}px`);
      });

      state.parallaxRAF = 0;
    });
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function init() {
  applyThemeOverrides();
  preloadKeyPhotos(2);
  renderPhotos();
  setupRevealObserver();
  setupMusic();
  setupPostcardInteraction();
  setupNavigationButtons();
  setupParallaxLite();
}

init();
