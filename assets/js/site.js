(() => {
  const languageSelect = document.getElementById('language-select');
  const locales = ['it', 'en', 'fr', 'es', 'de', 'zh'];
  const getInitialLanguage = () => {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (locales.includes(fromUrl)) return fromUrl;
    try {
      const saved = localStorage.getItem('athanor-language');
      if (locales.includes(saved)) return saved;
    } catch (_) { /* Storage may be unavailable; Italian remains the default. */ }
    return 'it';
  };

  const translate = async (language) => {
    if (language === 'it') {
      document.documentElement.lang = 'it';
      if (languageSelect) languageSelect.value = 'it';
      try { localStorage.setItem('athanor-language', 'it'); } catch (_) { /* Italian remains the document source language. */ }
      const italianUrl = new URL(window.location.href);
      italianUrl.searchParams.set('lang', 'it');
      window.history.replaceState({}, '', italianUrl);
      return;
    }
    try {
      const response = await fetch('assets/i18n/messages.json');
      if (!response.ok) throw new Error('Translation data not found');
      const messages = await response.json();
      const languageIndex = locales.indexOf(language) - 1;
      const localized = (key) => {
        if (languageIndex < 0) return undefined;
        const value = messages[key];
        return Array.isArray(value) ? value[languageIndex] : value;
      };
      document.documentElement.lang = language;
      document.querySelectorAll('[data-i18n]').forEach((element) => {
        const value = localized(element.dataset.i18n);
        if (typeof value === 'string') element.textContent = value;
      });
      document.querySelectorAll('[data-i18n-attr]').forEach((element) => {
        element.dataset.i18nAttr.split(';').forEach((mapping) => {
          const [attribute, key] = mapping.split(':');
          const value = localized(key);
          if (attribute && typeof value === 'string') element.setAttribute(attribute, value);
        });
      });
      document.querySelectorAll('[data-i18n-content]').forEach((element) => {
        const value = localized(element.dataset.i18nContent);
        if (typeof value === 'string') element.setAttribute('content', value);
      });
      if (languageSelect) languageSelect.value = language;
      const localeTag = { en: 'en_US', fr: 'fr_FR', es: 'es_ES', de: 'de_DE', zh: 'zh_CN' }[language];
      const localeMeta = document.querySelector('meta[property="og:locale"]');
      if (localeMeta && localeTag) localeMeta.setAttribute('content', localeTag);
      try { localStorage.setItem('athanor-language', language); } catch (_) { /* The URL remains shareable. */ }
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url);
    } catch (error) {
      console.warn('Athanor locale unavailable; Italian source text is shown.', error);
      document.documentElement.lang = 'it';
    }
  };

  const initialLanguage = getInitialLanguage();
  if (languageSelect) {
    languageSelect.value = initialLanguage;
    languageSelect.addEventListener('change', () => translate(languageSelect.value));
  }
  translate(initialLanguage);

  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const expanded = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(expanded));
    });
    siteNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }));
  }
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  const homeHero = document.querySelector('.hero');
  const portalOrbit = document.querySelector('.portal-orbit');
  const heroPortrait = document.querySelector('.hero-portrait-wrap');
  if (homeHero && portalOrbit && heroPortrait && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    homeHero.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const bounds = homeHero.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      portalOrbit.style.setProperty('--shift-x', `${(x * 22).toFixed(1)}px`);
      portalOrbit.style.setProperty('--shift-y', `${(y * 18).toFixed(1)}px`);
      heroPortrait.style.setProperty('--portrait-x', `${(-x * 5).toFixed(1)}px`);
      heroPortrait.style.setProperty('--portrait-y', `${(-y * 4).toFixed(1)}px`);
    }, { passive: true });
    homeHero.addEventListener('pointerleave', () => {
      ['--shift-x', '--shift-y'].forEach((key) => portalOrbit.style.removeProperty(key));
      ['--portrait-x', '--portrait-y'].forEach((key) => heroPortrait.style.removeProperty(key));
    });
  }

  const lightbox = document.getElementById('global-lightbox');
  if (lightbox) {
    const image = lightbox.querySelector('img');
    const closeButton = lightbox.querySelector('.lightbox-close');
    let previousTrigger = null;
    const closeLightbox = () => {
      lightbox.classList.remove('is-open');
      image.removeAttribute('src');
      document.body.style.overflow = '';
      if (previousTrigger) previousTrigger.focus();
    };
    document.querySelectorAll('[data-zoom-src]').forEach((trigger) => trigger.addEventListener('click', () => {
      previousTrigger = trigger;
      image.src = trigger.dataset.zoomSrc;
      image.alt = trigger.dataset.zoomAlt || '';
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      closeButton.focus();
    }));
    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
      if (event.key === 'Tab' && lightbox.classList.contains('is-open')) {
        event.preventDefault();
        closeButton.focus();
      }
    });
  }

  const cart = document.getElementById('cart-drawer');
  const cartToggle = document.getElementById('cart-toggle');
  const cartClose = document.getElementById('cart-close');
  if (cart && cartToggle && cartClose) {
    const closeCart = () => {
      cart.classList.remove('is-open');
      cart.setAttribute('aria-hidden', 'true');
      cart.setAttribute('inert', '');
      cartToggle.setAttribute('aria-expanded', 'false');
      cartToggle.focus();
    };
    cartToggle.addEventListener('click', () => {
      cart.classList.add('is-open');
      cart.removeAttribute('aria-hidden');
      cart.removeAttribute('inert');
      cartToggle.setAttribute('aria-expanded', 'true');
      cartClose.focus();
    });
    cartClose.addEventListener('click', closeCart);
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && cart.classList.contains('is-open')) closeCart(); });
  }

  const cosmosCanvas = document.getElementById('cosmos-field');
  if (cosmosCanvas && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    try {
      const gl = cosmosCanvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
      if (gl) {
        const vertexSource = `
          attribute vec3 aPosition;
          attribute vec3 aColor;
          attribute float aSize;
          uniform float uTime;
          uniform float uAspect;
          uniform vec2 uPointer;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float depth = 1.0 - fract(aPosition.z + uTime * 0.035);
            float perspective = 0.28 / (0.12 + depth);
            vec2 point = aPosition.xy * perspective;
            point.x *= min(1.0, uAspect);
            point += uPointer * (0.012 + (1.0 - depth) * 0.02);
            gl_Position = vec4(point, 0.0, 1.0);
            gl_PointSize = clamp(aSize * (1.0 - depth) * 4.2 + 0.7, 0.7, 3.8);
            vColor = aColor;
            vAlpha = (1.0 - depth) * 0.8;
          }`;
        const fragmentSource = `
          precision mediump float;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float radius = distance(gl_PointCoord, vec2(0.5));
            float glow = 1.0 - smoothstep(0.04, 0.5, radius);
            gl_FragColor = vec4(vColor, glow * vAlpha);
          }`;
        const compile = (type, source) => {
          const shader = gl.createShader(type);
          gl.shaderSource(shader, source);
          gl.compileShader(shader);
          if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
          return shader;
        };
        const program = gl.createProgram();
        gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
        gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        gl.useProgram(program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

        const count = window.innerWidth < 700 ? 420 : 850;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        for (let i = 0; i < count; i += 1) {
          positions[i * 3] = Math.random() * 2 - 1;
          positions[i * 3 + 1] = Math.random() * 2 - 1;
          positions[i * 3 + 2] = Math.random();
          const blueStar = Math.random() > 0.57;
          colors.set(blueStar ? [0.58, 0.68, 0.94] : [0.92, 0.78, 0.51], i * 3);
          sizes[i] = 0.45 + Math.random() * 0.85;
        }
        const bindAttribute = (name, data, size) => {
          const buffer = gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          const location = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(location);
          gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
        };
        bindAttribute('aPosition', positions, 3);
        bindAttribute('aColor', colors, 3);
        bindAttribute('aSize', sizes, 1);
        const timeUniform = gl.getUniformLocation(program, 'uTime');
        const aspectUniform = gl.getUniformLocation(program, 'uAspect');
        const pointerUniform = gl.getUniformLocation(program, 'uPointer');
        let pointerX = 0;
        let pointerY = 0;
        let animationFrame = 0;
        let startedAt = 0;
        const resize = () => {
          const rect = cosmosCanvas.getBoundingClientRect();
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
          cosmosCanvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
          cosmosCanvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
          gl.viewport(0, 0, cosmosCanvas.width, cosmosCanvas.height);
          gl.uniform1f(aspectUniform, rect.width / Math.max(1, rect.height));
        };
        const render = (time) => {
          if (document.hidden) { animationFrame = 0; return; }
          if (!startedAt) startedAt = time;
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform1f(timeUniform, (time - startedAt) / 1000);
          gl.uniform2f(pointerUniform, pointerX, pointerY);
          gl.drawArrays(gl.POINTS, 0, count);
          animationFrame = window.requestAnimationFrame(render);
        };
        resize();
        window.addEventListener('resize', resize, { passive: true });
        const hero = document.querySelector('.hero');
        if (hero) {
          hero.addEventListener('pointermove', (event) => {
            if (event.pointerType === 'touch') return;
            const rect = hero.getBoundingClientRect();
            pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
            pointerY = (0.5 - (event.clientY - rect.top) / rect.height) * 2;
            hero.style.setProperty('--glow-x', `${((pointerX + 1) * 50).toFixed(1)}%`);
            hero.style.setProperty('--glow-y', `${((1 - pointerY) * 50).toFixed(1)}%`);
          }, { passive: true });
          hero.addEventListener('pointerleave', () => {
            pointerX = 0;
            pointerY = 0;
            hero.style.removeProperty('--glow-x');
            hero.style.removeProperty('--glow-y');
          });
        }
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && !animationFrame) animationFrame = window.requestAnimationFrame(render);
        });
        animationFrame = window.requestAnimationFrame(render);
      }
    } catch (error) {
      console.warn('WebGL unavailable; the static cosmic background remains active.', error);
    }
  }
})();
