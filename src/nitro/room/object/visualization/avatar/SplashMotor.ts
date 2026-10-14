// @ts-nocheck
/**
 * Splash (efecto de entrada y salida de sala), portado del cliente de Hyris (hyris.life, HAR del 14-10-2026,
 * backups/hyris-har/legible). El código de dibujo es el suyo con los nombres sacados del minificado: no se
 * tipa a mano para no desviarse del original. Unidades: píxeles del keko a escala 1 con los pies en (0, 0) y
 * la cabeza hacia y = -116; el Pintor las pasa a la escala de la sala. t = ms desde que empieza; fase =
 * 'entry' | 'exit'. ESTILO es el del shader que construye o deshace el keko (SplashFiltro).
 */
const ESTILO = { HOLOGRAMA: 4, DESDE_ARRIBA: 5, DESDE_CENTRO: 6, ESQUIRLAS: 7, DESDE_ABAJO: 8, VIENTO: 9 }, DURACION_DISOLVER = 1150, VUELTA = Math.PI * 2, limitar = (i) => i < 0 ? 0 : i > 1 ? 1 : i, tramo = (i, e, s) => limitar((i - e) / (s - e)), suave = (i) => i * i * (3 - 2 * i), frena = (i) => 1 - (1 - i) * (1 - i), mezcla = (i, e, s) => i + (e - i) * s, azar = (i) => {
  let e = i >>> 0;
  return () => {
    e = e + 1831565813 >>> 0;
    let s = e;
    return s = Math.imul(s ^ s >>> 15, s | 1), s ^= s + Math.imul(s ^ s >>> 7, s | 61), ((s ^ s >>> 14) >>> 0) / 4294967296;
  };
}, ruido = (i) => {
  const e = Math.sin(i * 127.1) * 43758.5453;
  return e - Math.floor(e);
};
class Pintor {
  constructor(e, s, a, n) {
    this.g = e, this.escala = n, this.bx = Math.round(s), this.by = Math.round(a);
  }
  color(e, s) {
    return s <= 0.02 ? false : (this.g.globalAlpha = s > 1 ? 1 : s, this.g.fillStyle = e, true);
  }
  punto(e, s, a, n, r = 1) {
    if (!this.color(n, r))
      return;
    const o = Math.max(1, Math.round(a * this.escala));
    this.g.fillRect(this.bx + Math.round(e * this.escala - o / 2), this.by + Math.round(s * this.escala - o / 2), o, o);
  }
  rect(e, s, a, n, r, o = 1) {
    if (!this.color(r, o))
      return;
    const l = this.bx + Math.round(e * this.escala), A = this.by + Math.round(s * this.escala), u = this.bx + Math.round((e + a) * this.escala), d = this.by + Math.round((s + n) * this.escala);
    this.g.fillRect(l, A, Math.max(1, u - l), Math.max(1, d - A));
  }
  elipse(e, s, a, n, r, o = 1) {
    if (a < 0.5 || n < 0.5 || !this.color(r, o))
      return;
    const l = 1 / this.escala;
    for (let A = -n; A <= n; A += l) {
      const u = a * Math.sqrt(Math.max(0, 1 - A * A / (n * n)));
      if (u < 0.5)
        continue;
      const d = this.bx + Math.round((e - u) * this.escala), h = this.bx + Math.round((e + u) * this.escala);
      this.g.fillRect(d, this.by + Math.round((s + A) * this.escala), Math.max(1, h - d), 1);
    }
  }
  anillo(e, s, a, n, r, o = 1, l = 1, A = 0) {
    if (a < 0.5 || o <= 0.02)
      return;
    const u = Math.max(8, Math.ceil(VUELTA * Math.max(a, n) * this.escala / Math.max(1, l * this.escala * 0.9)));
    for (let d = 0; d < u; d++) {
      const h = A + d / u * VUELTA;
      this.punto(e + Math.cos(h) * a, s + Math.sin(h) * n, l, r(h), o);
    }
  }
  luz(e, s, a, n, r, o = 1) {
    if (r <= 0.02 || a < 1)
      return;
    const l = this.g, A = this.bx + e * this.escala, u = this.by + s * this.escala, d = a * this.escala;
    l.save(), l.translate(A, u), l.scale(1, o), l.globalAlpha = r > 1 ? 1 : r;
    const h = l.createRadialGradient(0, 0, 0, 0, 0, d);
    h.addColorStop(0, `rgba(${n[0]}, ${n[1]}, ${n[2]}, 1)`), h.addColorStop(1, `rgba(${n[0]}, ${n[1]}, ${n[2]}, 0)`), l.fillStyle = h, l.fillRect(-d, -d, d * 2, d * 2), l.restore();
  }
  pieza(e, s, a, n, r, o, l, A, u = 1, d = false) {
    if (!e || u <= 0.02)
      return;
    const h = this.g, m = Math.max(1, Math.round(n * A * this.escala)), g = Math.max(1, Math.round(r * A * this.escala)), p = this.bx + Math.round(o * this.escala - m / 2), f = this.by + Math.round(l * this.escala - g / 2);
    h.globalAlpha = u > 1 ? 1 : u, d ? (h.save(), h.translate(p + m, f), h.scale(-1, 1), h.drawImage(e, s, a, n, r, 0, 0, m, g), h.restore()) : h.drawImage(e, s, a, n, r, p, f, m, g);
  }
  sumar(e) {
    this.g.globalCompositeOperation = e ? "lighter" : "source-over";
  }
  terminar() {
    this.g.globalAlpha = 1, this.g.globalCompositeOperation = "source-over";
  }
}
const PORTAL = { id: "portal", color: 11693055, estilo: { entry: ESTILO.DESDE_ABAJO, exit: ESTILO.DESDE_ARRIBA }, duracion: 1500, crear: (i) => ({ chispas: Array.from({ length: 12 }, () => ({ a: i() * VUELTA, v: 0.6 + i() * 0.6, t0: i() * 800, cian: i() < 0.45 })) }), dibujar: (i, e, s, a) => {
  const n = frena(tramo(e, 0, 260)) * (1 - suave(tramo(e, s === "entry" ? 1180 : 1120, 1470)));
  if (n <= 0)
    return;
  const r = 24 * n, o = r * 0.5, A = (s === "entry" ? 1 : -1) * e * 6e-3;
  i.elipse(0, 0, r, o, "#12042a", 0.7 * n), i.elipse(0, 0, r * 0.66, o * 0.66, "#2e0a5c", 0.7 * n), i.elipse(0, 0, r * 0.3, o * 0.3, "#5b21b6", 0.8 * n);
  for (let u = 0; u < 3; u++)
    for (let d = 1; d < 8; d++) {
      const h = d / 8, m = A + u * VUELTA / 3 + h * 2.8;
      i.punto(Math.cos(m) * r * h * 0.92, Math.sin(m) * o * h * 0.92, h > 0.6 ? 2 : 1, h < 0.55 ? "#e9d5ff" : "#c084fc", n * (1.1 - h * 0.5));
    }
  i.anillo(0, 0, r, o, (u) => Math.floor((u - A) / VUELTA * 30) % 3 === 0 ? "#22d3ee" : "#a855f7", n, 2, A * 0.7), i.anillo(0, 0, r + 1.5, o + 0.75, () => "#3b0764", n * 0.8, 1);
  for (let u = 0; u < 3; u++) {
    const d = -A * 1.4 + u * VUELTA / 3;
    i.punto(Math.cos(d) * r, Math.sin(d) * o, 3, "#f5d0fe", n);
  }
  i.sumar(true);
  for (const u of a.chispas) {
    const d = (e - u.t0) / 650;
    d < 0 || d > 1 || i.punto(Math.cos(u.a) * r * 0.9 + Math.sin(d * 6 + u.a) * 2, Math.sin(u.a) * o * 0.9 - d * 58 * u.v, d < 0.4 ? 2 : 1, u.cian ? "#67e8f9" : "#d8b4fe", (1 - d) * n);
  }
  i.terminar();
} }, estrellita = (i, e, s, a, n) => {
  const r = Math.round(e), o = Math.round(s);
  i.rect(r - a - 1, o - 1, a * 2 + 3, 3, "#78350f", n * 0.55), i.rect(r - 1, o - a - 1, 3, a * 2 + 3, "#78350f", n * 0.55), i.rect(r - a, o, a * 2 + 1, 1, "#facc15", n), i.rect(r, o - a, 1, a * 2 + 1, "#facc15", n), i.rect(r - 1, o, 3, 1, "#fef08a", n), i.rect(r, o - 1, 1, 3, "#fef08a", n), i.rect(r, o, 1, 1, "#ffffff", n);
}, ESTRELLAS = { id: "stars", color: 16436245, estilo: { entry: ESTILO.DESDE_ARRIBA, exit: ESTILO.DESDE_ARRIBA }, duracion: 1500, crear: (i) => ({ estrellas: Array.from({ length: 11 }, (e, s) => ({ fase: s * VUELTA / 11 + i() * 0.4, retraso: i() * 200, grande: i() < 0.35, brillo: i() * VUELTA })), destellos: Array.from({ length: 8 }, (e, s) => ({ a: s * VUELTA / 8 + i() * 0.3, v: 13 + i() * 10 })) }), dibujar: (i, e, s, a) => {
  const n = s === "entry", r = n ? 1 : -1, o = tramo(e, 0, 200) * (1 - tramo(e, 950, 1350));
  i.sumar(true), i.luz(0, -46, 30, [253, 224, 71], 0.2 * o, 1.4), i.sumar(false);
  for (const A of a.estrellas) {
    const u = limitar((e - A.retraso) / 1080);
    if (u <= 0 || u >= 1)
      continue;
    const d = n ? mezcla(-116, -6, suave(u)) : mezcla(-6, -116, suave(u)), h = n ? mezcla(25, 12, u) : mezcla(12, 25, u), m = A.fase + r * e * 95e-4, g = Math.sin(m) > 0, p = Math.min(1, u * 6, (1 - u) * 6) * (g ? 1 : 0.45);
    for (let b = 1; b <= 3; b++) {
      const E = m - r * b * 0.2;
      i.punto(Math.cos(E) * h, d - r * b * 2.5 + Math.sin(E) * h * 0.35, 1, b === 1 ? "#facc15" : "#fde68a", p * (0.75 - b * 0.18));
    }
    const f = Math.sin(e * 0.02 + A.brillo) > 0.55;
    estrellita(i, Math.cos(m) * h, d + Math.sin(m) * h * 0.35, (A.grande ? 2 : 1) + (f ? 1 : 0), p);
  }
  const l = n ? tramo(e, 1100, 1480) : tramo(e, 1150, 1500);
  if (l > 0 && l < 1) {
    const A = n ? -50 : -116;
    for (const u of a.destellos) {
      const d = u.v * frena(l);
      estrellita(i, Math.cos(u.a) * d, A + Math.sin(u.a) * d * 0.6, l < 0.5 ? 2 : 1, 1 - l);
    }
  }
  i.terminar();
} }, MORADOS = ["#fdf4ff", "#f0abfc", "#e879f9", "#c084fc", "#a855f7", "#7c3aed", "#6d28d9", "#c084fc"], AGUJERO_NEGRO = { id: "blackhole", color: 9647082, estilo: { entry: ESTILO.DESDE_CENTRO, exit: ESTILO.DESDE_CENTRO }, duracion: 1520, crear: (i) => ({ motas: Array.from({ length: 16 }, () => ({ a: i() * VUELTA, r0: 16 + i() * 16, t0: i() * 520, clara: i() < 0.4 })) }), dibujar: (i, e, s, a) => {
  const n = s === "exit", r = -46, o = n ? 8 * frena(tramo(e, 0, 300)) * (1 - suave(tramo(e, 1100, 1280))) : 7 * frena(tramo(e, 0, 220)) * (1 - suave(tramo(e, 650, 1080))), l = n ? tramo(e, 1260, 1520) : tramo(e, 1060, 1360);
  if (l > 0 && l < 1) {
    const u = 5 + 20 * frena(l);
    i.anillo(0, r, u, u * 0.5, () => "#f5d0fe", 1 - l, 1);
  }
  if (o > 0.4) {
    const u = e * 0.013, d = o * 2.8, h = o * 0.75, m = (g) => {
      const p = Math.ceil(d * 4);
      for (let f = 0; f < p; f++) {
        const b = u + f / p * VUELTA;
        if (Math.sin(b) > 0 !== g)
          continue;
        const E = MORADOS[Math.floor((b - u) / VUELTA * MORADOS.length + e * 0.01) % MORADOS.length];
        i.punto(Math.cos(b) * d, r + Math.sin(b) * h, g && o > 5 ? 2 : 1, E, g ? 1 : 0.55);
      }
    };
    m(false), i.elipse(0, r, o, o, "#040008", 1), i.anillo(0, r, o + 0.5, o + 0.5, () => "#a855f7", 0.95, 1), m(true);
  }
  const A = n ? 1 - tramo(e, 1100, 1250) : 1 - tramo(e, 900, 1100);
  for (const u of a.motas) {
    const d = (e - u.t0) / 650;
    if (d <= 0 || d >= 1)
      continue;
    const h = n ? u.r0 * (1 - d) : u.r0 * d, m = u.a + (n ? 1 : -1) * d * 4.2;
    i.punto(Math.cos(m) * h, r + Math.sin(m) * h * 0.5, h > 12 ? 2 : 1, u.clara ? "#f5d0fe" : "#7e22ce", Math.min(1, d * 5, (1 - d) * 5) * A);
  }
  i.terminar();
} }, HOLOGRAMA = { id: "hologram", color: 2282478, estilo: { entry: ESTILO.HOLOGRAMA, exit: ESTILO.HOLOGRAMA }, duracion: 1400, crear: (i) => ({ fallos: Array.from({ length: 7 }, () => ({ x: -17 + i() * 26, y: -88 + i() * 80, ancho: 3 + Math.floor(i() * 9), s: Math.floor(i() * 1e3) })) }), dibujar: (i, e, s, a) => {
  const n = suave(tramo(e, 0, 160)) * (1 - suave(tramo(e, 1150, 1400)));
  if (!(n <= 0)) {
    i.elipse(0, 0, 15, 7.5, "#062a36", 0.6 * n), i.anillo(0, 0, 15, 7.5, () => "#67e8f9", n, 1), i.anillo(0, 0, 10, 5, () => "#0891b2", n * 0.9, 1), i.sumar(true);
    for (let r = 0; r > -100; r -= 2) {
      const o = -r / 100, l = mezcla(13, 20, o);
      i.rect(-l, r - 2, l * 2, 2, "#0e7490", 0.3 * (1 - o * 0.55) * n * (-r / 2 % 2 ? 1 : 0.5));
    }
    if (e < 1150) {
      const r = e / 1150, o = s === "entry" ? mezcla(-2, -96, r) : mezcla(-96, -2, r);
      i.rect(-20, o - 1, 40, 1, "#cffafe", 0.9 * n), i.rect(-20, o, 40, 2, "#0891b2", 0.5 * n);
      for (const l of a.fallos)
        ruido(Math.floor((e + l.s) / 70) + l.s) > 0.55 && i.rect(l.x, l.y, l.ancho, 1, "#a5f3fc", 0.75 * n);
    }
    i.terminar();
  }
} }, colorLlama = (i) => i < 0.2 ? "#fef08a" : i < 0.42 ? "#fbbf24" : i < 0.66 ? "#f97316" : "#dc2626", lenguaFuego = (i, e, s, a, n, r) => {
  const o = Math.round(a);
  if (o < 2)
    return;
  const l = Math.round(e), A = [[1, "#b91c1c", 1], [0, "#f97316", 0.85], [-1, "#fde047", 0.5]];
  for (const [u, d, h] of A)
    for (let m = 0; m < o * h; m++) {
      const g = m / o, p = Math.round(n * (1 - g * g) + u * 2 * (1 - g));
      p < 1 || i.rect(l - Math.floor(p / 2), Math.round(s) - m - 1, p, 1, d, r);
    }
}, LLAMAS = { id: "fire", color: 16486972, estilo: { entry: ESTILO.DESDE_ABAJO, exit: ESTILO.DESDE_ARRIBA }, duracion: 1560, crear: (i) => ({ lenguas: Array.from({ length: 7 }, (e, s) => ({ x: -15 + s * 5 + (i() * 2 - 1), z: (i() * 2 - 1) * 4, fase: i() * VUELTA, alto: 12 + i() * 10, ancho: 4 + Math.floor(i() * 3) })), llamas: Array.from({ length: 30 }, (e, s) => ({ t0: s / 30 * 1020 + i() * 50, x: (i() * 2 - 1) * 13, alto: 34 + i() * 30, fase: i() * VUELTA, tam: 2 + Math.floor(i() * 2) })), pavesas: Array.from({ length: 10 }, () => ({ t0: i() * 1e3, x: (i() * 2 - 1) * 12, alto: 80 + i() * 35, dx: (i() * 2 - 1) * 16 })) }), dibujar: (i, e, s, a) => {
  const n = (l) => s === "entry" ? suave(tramo(l, 0, 150)) * (1 - suave(tramo(l, 700, 1080))) : suave(tramo(l, 0, 250)) * (1 - suave(tramo(l, 950, 1200))), r = n(e);
  i.sumar(true), i.luz(0, -4, 28, [251, 146, 60], 0.45 * r, 0.55), i.sumar(false);
  const o = [...a.lenguas].sort((l, A) => l.z - A.z);
  for (const l of o) {
    const A = l.alto * r * (0.7 + 0.45 * Math.abs(Math.sin(e * 0.011 + l.fase)));
    lenguaFuego(i, l.x + Math.sin(e * 0.017 + l.fase), l.z * 0.5, A, l.ancho, 1);
  }
  for (const l of a.llamas) {
    const A = (e - l.t0) / 520;
    if (A < 0 || A > 1)
      continue;
    const u = n(l.t0);
    if (u <= 0.05)
      continue;
    const d = l.x * (1 - A * 0.5) + Math.sin(A * 9 + l.fase) * 2.5, h = -8 - A * l.alto;
    A < 0.86 ? i.punto(d, h, Math.max(1, Math.round(l.tam * (1 - A * 0.6))), colorLlama(A), u) : i.punto(d, h, 2, "#57534e", u * ((1 - A) / 0.14) * 0.6);
  }
  for (const l of a.pavesas) {
    const A = (e - l.t0) / 700;
    A < 0 || A > 1 || i.punto(l.x + l.dx * A, -10 - A * l.alto, 1, A < 0.5 ? "#fde047" : "#f97316", (1 - A) * n(l.t0));
  }
  i.terminar();
} }, HIELO = { id: "ice", color: 8246268, estilo: { entry: ESTILO.ESQUIRLAS, exit: ESTILO.ESQUIRLAS }, duracion: 1560, crear: (i) => {
  const e = [];
  for (let s = 0; s < 3; s++) {
    let a = -10 + s * 10 + (i() * 6 - 3), n = -20 - i() * 60;
    const r = [[a, n]];
    for (let o = 0; o < 7; o++)
      a += i() * 6 - 3, n += i() < 0.5 ? -4 : 4, r.push([a, n]);
    e.push(r);
  }
  return { grietas: e, esquirlas: Array.from({ length: 20 }, () => ({ x: (i() * 2 - 1) * 19, y: -6 - i() * 96, vx: (i() * 2 - 1) * 60, vy: -25 - i() * 45, tam: 2 + Math.floor(i() * 3), c: Math.floor(i() * 3) })), copos: Array.from({ length: 6 }, () => ({ x: (i() * 2 - 1) * 18, y: (i() * 2 - 1) * 6, t0: i() * 300 })) };
}, dibujar: (i, e, s, a) => {
  const n = s === "entry" ? 950 : 1090, r = suave(tramo(e, 0, s === "entry" ? 380 : 460));
  if (e < n) {
    const o = 94 * r, l = 21;
    i.elipse(0, 0, l, 7, "#bae6fd", 0.35), i.rect(-l, -o, l, o, "#e0f2fe", 0.3), i.rect(0, -o, l, o, "#7dd3fc", 0.32), i.rect(-l, -o, 1, o, "#f0f9ff", 0.9), i.rect(l - 1, -o, 1, o, "#0ea5e9", 0.85), i.rect(0, -o + 2, 1, o - 2, "#f0f9ff", 0.5);
    for (const [u, d, h, m] of [[-l, 14, 9, true], [-7, 14, 15, true], [7, 14, 7, false]]) {
      const g = Math.round(h * r);
      for (let p = 0; p < g; p++) {
        const f = Math.round(d * (1 - p / g));
        i.rect(u + Math.floor((d - f) / 2), -o - p - 1, Math.max(1, f), 1, m ? "#e0f2fe" : "#7dd3fc", 0.4);
      }
      i.rect(u + Math.floor(d / 2), -o - g, 1, g, "#ffffff", 0.55);
    }
    for (let u = 0; u < 9 && !(u * 3 > o - 10); u++)
      i.punto(-14 + u, -o + 10 + u * 3, 1, "#ffffff", 0.7), i.punto(-10 + u, -o + 22 + u * 3, 1, "#ffffff", 0.4);
    const A = tramo(e, n - 240, n - 20);
    if (A > 0)
      for (const u of a.grietas) {
        const d = Math.floor(u.length * A);
        for (let h = 0; h < d; h++)
          i.punto(u[h][0], u[h][1], 1, "#ffffff", 0.95);
      }
  } else {
    const o = (e - n) / 460;
    o < 0.25 && i.anillo(0, -46, 22 + o * 30, 26 + o * 30, () => "#f0f9ff", (0.25 - o) * 3, 1);
    for (const l of a.esquirlas) {
      if (o > 1)
        break;
      const A = l.x + l.vx * o, u = l.y + l.vy * o + 0.5 * 300 * o * o, d = l.c === 0 ? "#f0f9ff" : l.c === 1 ? "#bae6fd" : "#7dd3fc", h = 1 - o;
      i.punto(A + 1, u + 1, l.tam, "#0c4a6e", h * 0.5), i.punto(A, u, l.tam, d, h), i.punto(A - l.tam / 2 + 0.5, u - l.tam / 2 + 0.5, 1, "#ffffff", h);
    }
    if (s === "entry")
      for (const l of a.copos) {
        const A = limitar((e - n - l.t0) / 300);
        if (A <= 0 || A >= 1)
          continue;
        const u = Math.sin(A * Math.PI);
        i.punto(l.x, l.y, 1, "#ffffff", u), i.punto(l.x - 1, l.y, 1, "#bae6fd", u * 0.7), i.punto(l.x + 1, l.y, 1, "#bae6fd", u * 0.7), i.punto(l.x, l.y - 1, 1, "#bae6fd", u * 0.7), i.punto(l.x, l.y + 1, 1, "#bae6fd", u * 0.7);
      }
  }
  i.terminar();
} }, ROSAS = ["#f9a8d4", "#fbcfe8", "#f472b6"], petalo = (i, e, s, a, n, r) => {
  const o = ROSAS[n], l = Math.round(e), A = Math.round(s), u = a ? [[1, 0, "#fff1f2"], [2, 0, o], [0, 1, o], [1, 1, o], [2, 1, o], [3, 1, "#f472b6"], [1, 2, "#f472b6"], [2, 2, "#db2777"]] : [[0, 0, "#fff1f2"], [0, 1, o], [1, 1, o], [1, 2, o], [2, 2, o], [1, 3, "#f472b6"], [2, 3, "#db2777"], [0, 2, o]];
  for (const [d, h] of u)
    i.rect(l + d, A + h + 1, 1, 1, "#9d174d", r * 0.35);
  for (const [d, h, m] of u)
    i.rect(l + d, A + h, 1, 1, m, r);
}, SAKURA = { id: "sakura", color: 16361684, estilo: { entry: ESTILO.VIENTO, exit: ESTILO.VIENTO }, duracion: 1600, crear: (i) => ({ petalos: Array.from({ length: 18 }, () => ({ a: i() * VUELTA, h: -6 - i() * 86, r: 15 + i() * 9, vel: 55e-4 + i() * 4e-3, t0: i() * 250, c: Math.floor(i() * 3), gira: i() * VUELTA, cae: 30 + i() * 40, dx: (i() * 2 - 1) * 14 })) }), dibujar: (i, e, s, a) => {
  const n = s === "entry";
  for (const r of a.petalos) {
    const o = limitar((e - r.t0) / 1150);
    if (o <= 0)
      continue;
    const l = r.a + e * r.vel;
    let A, u, d, h = Math.min(1, o * 5);
    if (n) {
      if (A = mezcla(r.r + 22, r.r, frena(o)), u = r.h + Math.sin(e * 4e-3 + r.gira) * 3, d = Math.cos(l) * A, e > 1150 + r.t0) {
        const g = limitar((e - 1150 - r.t0) / 420);
        u += r.cae * g * g, d += r.dx * g, h *= 1 - g;
      }
    } else if (A = mezcla(r.r, r.r + 24, suave(o)), u = r.h - 34 * o, d = Math.cos(l) * A, e > 1150 + r.t0) {
      const g = limitar((e - 1150 - r.t0) / 420);
      d += 30 * g, u -= 18 * g, h *= 1 - g;
    }
    const m = Math.sin(l) > 0;
    petalo(i, d, u + Math.sin(l) * A * 0.3, Math.sin(e * 0.012 + r.gira) > 0, r.c, h * (m ? 1 : 0.5));
  }
  i.terminar();
} }, IRIS = ["#7dd3fc", "#a5f3fc", "#c4b5fd", "#f9a8d4", "#fde68a", "#a5f3fc", "#7dd3fc", "#38bdf8"], pompa = (i, e, s, a, n) => {
  if (a < 2.2) {
    i.punto(e - 1, s, 1, "#38bdf8", n), i.punto(e + 1, s, 1, "#7dd3fc", n), i.punto(e, s - 1, 1, "#ffffff", n), i.punto(e, s + 1, 1, "#0ea5e9", n);
    return;
  }
  i.anillo(e, s, a, a, (r) => IRIS[Math.floor((r + VUELTA) % VUELTA / VUELTA * IRIS.length) % IRIS.length], n, 1), a > 6 && i.anillo(e, s, a - 1, a - 1, () => "#e0f2fe", n * 0.35, 1), i.punto(e - a * 0.45, s - a * 0.45, 1, "#ffffff", n);
}, BURBUJAS = { id: "bubbles", color: 8246268, estilo: { entry: ESTILO.DESDE_CENTRO, exit: ESTILO.DESDE_CENTRO }, duracion: 1500, crear: (i) => ({ pompas: Array.from({ length: 12 }, () => ({ t0: i() * 1e3, x: (i() * 2 - 1) * 18, r: 1.5 + i() * 2.5, alto: 40 + i() * 55, fase: i() * VUELTA })), gotas: Array.from({ length: 16 }, (e, s) => ({ a: s * VUELTA / 16 + i() * 0.2, v: 14 + i() * 10 })) }), dibujar: (i, e, s, a) => {
  const r = s === "entry" ? 1e3 : 1160, l = -46 - (s === "exit" ? 30 * suave(tramo(e, 450, r)) : 0);
  if (e < r) {
    const A = 25 * frena(tramo(e, 0, 280));
    i.elipse(0, l, A, A, "#e0f2fe", 0.1), pompa(i, 0, l, A, 0.9), i.sumar(true);
    for (let u = 0; u < 7; u++) {
      const d = Math.PI + 0.55 + u * 0.12;
      i.punto(Math.cos(d) * (A - 3), l + Math.sin(d) * (A - 3), 1, "#ffffff", 0.8);
    }
    i.sumar(false);
  } else {
    const A = (e - r) / 320;
    if (A < 0.3 && i.anillo(0, l, 27 + A * 8, 27 + A * 8, () => "#e0f2fe", (0.3 - A) * 3, 1), A < 1)
      for (const u of a.gotas) {
        const d = 25 + u.v * A;
        i.punto(Math.cos(u.a) * d, l + Math.sin(u.a) * d + 40 * A * A, 1, u.v > 19 ? "#ffffff" : "#7dd3fc", 1 - A);
      }
  }
  for (const A of a.pompas) {
    const u = (e - A.t0) / 700;
    if (u < 0 || u > 1.15)
      continue;
    const d = A.x + Math.sin(u * 8 + A.fase) * 2, h = -(Math.min(u, 1) * A.alto);
    if (u <= 1)
      pompa(i, d, h, A.r, 0.95);
    else {
      const m = (u - 1) / 0.15;
      for (let g = 0; g < 4; g++)
        i.punto(d + Math.cos(g * 1.57) * (A.r + m * 3), h + Math.sin(g * 1.57) * (A.r + m * 3), 1, "#e0f2fe", 1 - m);
    }
  }
  i.terminar();
} }, EFECTOS = Object.create(null);
for (const i of [PORTAL, ESTRELLAS, AGUJERO_NEGRO, HOLOGRAMA, LLAMAS, HIELO, SAKURA, BURBUJAS])
  EFECTOS[i.id] = i;
const semilla = (i, e, s) => (i * 73856093 ^ e * 19349663 ^ (s === "entry" ? 20973 : 58391)) >>> 0, MOVIMIENTOS = ["espiral", "estallido", "lluvia", "subida", "orbita", "remolino", "chispas", "enjambre", "anillo"], SUELOS = ["ninguno", "circulo", "runas", "onda", "grietas", "charco"], FINALES = ["ninguno", "destello", "estallido", "columna"], ESTILOS_VALIDOS = [0, 4, 5, 6, 7, 8, 9], DURACION_RECETA = 1500, MAX_CAPAS = 3, MAX_PARTICULAS = 24, PIEZAS = 4, COLORES_BASE = ["#a855f7", "#22d3ee", "#f5f3ff", "#2e1065", "#f472b6"], acelera = (i) => i * i, acotar = (i, e, s, a, n = false) => {
  let r = Number(i);
  return Number.isFinite(r) || (r = a), n && (r = Math.round(r)), r < e ? e : r > s ? s : r;
}, colorValido = (i, e) => typeof i == "string" && /^#[0-9a-fA-F]{6}$/.test(i.trim()) ? i.trim().toLowerCase() : e, unoDe = (i, e, s) => i.includes(e) ? e : s, normalizarReceta = (i) => {
  var r, o;
  const e = i && typeof i == "object" ? i : {}, s = (Array.isArray(e.colores) ? e.colores : []).slice(0, 5).map((l, A) => colorValido(l, COLORES_BASE[A]));
  for (; s.length < 3; )
    s.push(COLORES_BASE[s.length]);
  const a = (l, A) => ESTILOS_VALIDOS.includes(Math.round(Number(l))) ? Math.round(Number(l)) : A, n = (Array.isArray(e.capas) ? e.capas : []).slice(0, MAX_CAPAS).map((l) => ({ mov: unoDe(MOVIMIENTOS, l == null ? void 0 : l.mov, "espiral"), pieza: acotar(l == null ? void 0 : l.pieza, -2, PIEZAS - 1, -1, true), n: acotar(l == null ? void 0 : l.n, 3, MAX_PARTICULAS, 10, true), tam: acotar(l == null ? void 0 : l.tam, 1, 3, 1, true), vel: acotar(l == null ? void 0 : l.vel, 0.6, 1.6, 1), color: acotar(l == null ? void 0 : l.color, 0, 4, 0, true), estela: !!(l != null && l.estela), sumar: !!(l != null && l.sumar) }));
  return n.length || n.push({ mov: "espiral", pieza: -1, n: 12, tam: 1, vel: 1, color: 0, estela: true, sumar: true }), { colores: s, borde: colorValido(e.borde, s[0]), estilo: { entrada: a((r = e.estilo) == null ? void 0 : r.entrada, 8), salida: a((o = e.estilo) == null ? void 0 : o.salida, 5) }, suelo: unoDe(SUELOS, e.suelo, "ninguno"), capas: n, final: unoDe(FINALES, e.final, "ninguno"), luz: !!e.luz, usar: normalizarUsar(e.usar) };
}, normalizarUsar = (i) => {
  const e = [];
  for (const s of Array.isArray(i) ? i : []) {
    const a = Math.round(Number(s));
    Number.isFinite(a) && a >= 0 && a < PIEZAS && !e.includes(a) && e.push(a);
  }
  return e.length ? e : [0, 1, 2, 3];
}, rgb = (i) => {
  const e = parseInt(i.slice(1), 16);
  return [e >> 16 & 255, e >> 8 & 255, e & 255];
}, aclarar = (i, e) => {
  const [s, a, n] = rgb(i), r = (o) => Math.round(o + (255 - o) * e).toString(16).padStart(2, "0");
  return `#${r(s)}${r(a)}${r(n)}`;
}, PECHO = -46, MOV = { espiral: { crear: (i, e) => Array.from({ length: e }, (s, a) => ({ fase: a * VUELTA / e + i() * 0.4, retraso: i() * 220 })), pos: (i, e, s, a) => {
  const n = limitar((e - i.retraso) / 1080);
  if (n <= 0 || n >= 1)
    return null;
  const r = s ? mezcla(-116, -6, suave(n)) : mezcla(-6, -116, suave(n)), o = s ? mezcla(26, 12, n) : mezcla(12, 26, n), l = i.fase + (s ? 1 : -1) * e * 95e-4 * a, A = Math.sin(l) < 0;
  return { x: Math.cos(l) * o, y: r + Math.sin(l) * o * 0.35, a: Math.min(1, n * 6, (1 - n) * 6) * (A ? 0.45 : 1), detras: A };
} }, estallido: { crear: (i, e) => Array.from({ length: e }, (s, a) => ({ a: a * VUELTA / e + i() * 0.5, d: 24 + i() * 20, alto: (i() - 0.5) * 40, t0: i() * 160 })), pos: (i, e, s, a) => {
  const n = 820 / a;
  if (s) {
    const l = tramo(e, 120 + i.t0, 120 + i.t0 + n);
    if (l <= 0 || l >= 1)
      return null;
    const A = i.d * (1 - acelera(l));
    return { x: Math.cos(i.a) * A, y: PECHO + i.alto * (1 - l) + Math.sin(i.a) * A * 0.55, a: Math.min(1, l * 5) * (1 - tramo(l, 0.85, 1)) };
  }
  const r = tramo(e, i.t0, i.t0 + n);
  if (r <= 0 || r >= 1)
    return null;
  const o = i.d * frena(r);
  return { x: Math.cos(i.a) * o, y: PECHO + i.alto * r + Math.sin(i.a) * o * 0.55 + 22 * r * r, a: 1 - r };
} }, lluvia: { crear: (i, e) => Array.from({ length: e }, () => ({ x: (i() * 2 - 1) * 24, suelo: (i() - 0.5) * 8, t0: i() * 850, v: 0.85 + i() * 0.4, y0: -118 - i() * 26 })), pos: (i, e, s, a) => {
  const n = (e - i.t0) / (560 / (a * i.v));
  return n <= 0 || n >= 1 ? null : { x: i.x, y: mezcla(i.y0, i.suelo, Math.pow(n, 1.4)), a: Math.min(1, n * 6) };
}, extra: (i, e, s, a, n, r, o) => {
  const l = (s - e.t0) / (560 / (n * e.v));
  if (l < 1 || l > 1.3)
    return;
  const A = (l - 1) / 0.3;
  for (const u of [-1, 1])
    i.punto(e.x + u * (2 + A * 5), e.suelo - 4 * Math.sin(A * Math.PI), Math.max(1, o - 1), r, 1 - A);
} }, subida: { crear: (i, e) => Array.from({ length: e }, () => ({ x: (i() * 2 - 1) * 18, t0: i() * 1e3, alto: 50 + i() * 62, amp: 2 + i() * 3, fase: i() * VUELTA })), pos: (i, e, s, a) => {
  const n = (e - i.t0) / (720 / a);
  return n <= 0 || n >= 1 ? null : { x: i.x + Math.sin(n * 7 + i.fase) * i.amp, y: -(n * i.alto), a: Math.min(1, n * 5, (1 - n) * 3) };
} }, orbita: { crear: (i, e) => Array.from({ length: e }, (s, a) => ({ fase: a * VUELTA / e, alto: (i() - 0.5) * 34 })), pos: (i, e, s, a) => {
  if (e > 1420)
    return null;
  const n = s ? mezcla(36, 7, suave(tramo(e, 0, 1150))) : mezcla(7, 38, suave(tramo(e, 120, 1350))), r = i.fase + (s ? 1 : -1) * e * 8e-3 * a, o = Math.sin(r) < 0, l = tramo(e, 0, 200) * (1 - tramo(e, s ? 1080 : 1150, s ? 1300 : 1420));
  return { x: Math.cos(r) * n, y: PECHO + i.alto + Math.sin(r) * n * 0.35, a: l * (o ? 0.45 : 1), detras: o };
} }, remolino: { crear: (i, e) => Array.from({ length: e }, () => ({ h: i(), fase: i() * VUELTA })), pos: (i, e, s, a) => {
  const n = frena(tramo(e, 0, 380)), r = s ? tramo(e, 950, 1280) : tramo(e, 1080, 1420), o = (6 + i.h * 22) * n + r * 26, l = i.fase + e * 0.013 * a * (1.6 - i.h), A = Math.sin(l) < 0;
  return r >= 1 ? null : { x: Math.cos(l) * o, y: -(i.h * 104) - r * 10 + Math.sin(l) * o * 0.32, a: n * (1 - r) * (A ? 0.45 : 1), detras: A };
} }, chispas: { crear: (i, e) => Array.from({ length: e }, () => ({ x: (i() * 2 - 1) * 21, y: -6 - i() * 96, t0: i() * 1150, vida: 240 + i() * 220 })), pos: (i, e, s, a) => {
  const n = (e - i.t0) / (i.vida / a);
  return n <= 0 || n >= 1 ? null : { x: i.x, y: i.y - n * 4, a: Math.sin(n * Math.PI) };
} }, enjambre: { crear: (i, e) => Array.from({ length: e }, () => ({ x0: (i() < 0.5 ? -1 : 1) * (34 + i() * 18), y0: -16 - i() * 96, x1: (i() * 2 - 1) * 8, y1: -24 - i() * 60, curva: 16 + i() * 24, t0: i() * 380, fase: i() * VUELTA })), pos: (i, e, s, a) => {
  const n = tramo(e, i.t0, i.t0 + 900 / a);
  if (n <= 0 || n >= 1)
    return null;
  const r = s ? suave(n) : frena(n), [o, l, A, u] = s ? [i.x0, i.y0, i.x1, i.y1] : [i.x1, i.y1, i.x0 * 1.1, i.y0 - 30], d = mezcla(o, A, r), h = mezcla(l, u, r) - Math.sin(r * Math.PI) * i.curva + Math.sin(e * 0.03 + i.fase) * 2, m = A - o;
  return { x: d, y: h, a: s ? Math.min(1, n * 5) * (1 - tramo(n, 0.85, 1)) : Math.min(1, n * 8) * (1 - tramo(n, 0.7, 1)), voltear: m < 0 };
} }, anillo: { crear: (i, e) => Array.from({ length: e }, (s, a) => ({ fase: a * VUELTA / e, ola: a % 2 })), pos: (i, e, s, a) => {
  const n = i.ola * 260, r = tramo(e, n, n + 860 / a);
  if (r <= 0 || r >= 1)
    return null;
  const o = s ? mezcla(40, 4, suave(r)) : mezcla(4, 42, frena(r)), l = i.fase + r * 1.2;
  return { x: Math.cos(l) * o, y: -1 + Math.sin(l) * o * 0.5, a: Math.min(1, r * 6) * (1 - tramo(r, 0.75, 1)), detras: Math.sin(l) < 0 };
} } }, RUNAS = [[0, 0, 1, 0, 2, 0, 1, 1, 1, 2], [0, 0, 0, 1, 0, 2, 1, 1, 2, 0, 2, 2], [1, 0, 0, 1, 2, 1, 1, 2], [0, 0, 2, 0, 1, 1, 0, 2, 2, 2], [0, 0, 1, 0, 2, 0, 2, 1, 2, 2, 1, 2]], pintarSuelo = (i, e, s, a, n) => {
  if (e.suelo === "ninguno")
    return;
  const [r, o, l, A] = e.colores, u = frena(tramo(s, 0, 260)) * (1 - suave(tramo(s, a ? 1150 : 1100, 1460)));
  if (u <= 0)
    return;
  const d = (a ? 1 : -1) * s * 4e-3;
  switch (e.suelo) {
    case "circulo":
    case "runas": {
      const h = 23 * u, m = h * 0.5;
      if (i.elipse(0, 0, h, m, A, 0.35 * u), i.anillo(0, 0, h, m, (g) => Math.floor((g - d) / VUELTA * 28) % 4 === 0 ? l : r, u, 1, d), i.anillo(0, 0, h * 0.68, m * 0.68, (g) => Math.floor((g + d) / VUELTA * 20) % 3 === 0 ? r : o, u * 0.85, 1, -d), e.suelo === "runas")
        for (let g = 0; g < 6; g++) {
          const p = d + g * VUELTA / 6, f = RUNAS[(g + n.signo) % RUNAS.length], b = Math.round(Math.cos(p) * h * 0.84) - 1, E = Math.round(Math.sin(p) * m * 0.84) - 1, I = Math.sin(s * 0.012 + g) > 0 ? l : o;
          for (let _ = 0; _ < f.length; _ += 2)
            i.rect(b + f[_], E + f[_ + 1], 1, 1, I, u);
        }
      else
        for (let g = 0; g < 5; g++) {
          const p = d + g * VUELTA / 5, f = d + (g + 2) % 5 * VUELTA / 5;
          for (let b = 0; b <= 1; b += 0.08)
            i.punto(mezcla(Math.cos(p), Math.cos(f), b) * h * 0.66, mezcla(Math.sin(p), Math.sin(f), b) * m * 0.66, 1, o, u * 0.7);
        }
      break;
    }
    case "onda":
      for (let h = 0; h < 3; h++) {
        const m = tramo(s, h * 280, h * 280 + 900);
        if (m <= 0 || m >= 1)
          continue;
        const g = a ? mezcla(36, 6, m) : mezcla(6, 38, frena(m));
        i.anillo(0, 0, g, g * 0.5, () => h === 1 ? o : r, (1 - m) * u, 1);
      }
      break;
    case "grietas": {
      const h = frena(tramo(s, 0, 360));
      for (const m of n.grietas) {
        let g = 0, p = 0;
        for (let f = 0; f < m.pasos.length && !(f / m.pasos.length > h); f++)
          g += m.pasos[f][0], p += m.pasos[f][1], i.punto(g, p, 1, A, u), i.punto(g, p - 1, 1, Math.sin(s * 0.02 + f) > 0 ? l : r, u * 0.9);
      }
      break;
    }
    case "charco": {
      const h = 22 * u;
      i.elipse(0, 0, h, h * 0.5, A, 0.75 * u), i.elipse(0, 0, h * 0.65, h * 0.32, r, 0.45 * u), i.anillo(0, 0, h, h * 0.5, () => o, u, 1);
      for (let m = 0; m < 3; m++) {
        const g = s * 3e-3 + m * VUELTA / 3;
        i.punto(Math.cos(g) * h * 0.45, Math.sin(g) * h * 0.2, 1, l, u * 0.8);
      }
      break;
    }
  }
}, pintarFinal = (i, e, s, a, n) => {
  if (e.final === "ninguno")
    return;
  const [r, , o] = e.colores, l = a ? tramo(s, 1060, 1380) : tramo(s, 1140, 1480);
  if (l <= 0 || l >= 1)
    return;
  const A = a ? PECHO : -58;
  switch (e.final) {
    case "destello": {
      const u = Math.round(4 + 22 * frena(l)), d = 1 - l;
      i.sumar(true), i.luz(0, A, 18, rgb(r), 0.35 * d), i.sumar(false), i.rect(-u, A, u * 2 + 1, 1, o, d), i.rect(0, A - u, 1, u * 2 + 1, o, d), i.rect(-Math.round(u * 0.4), A - 1, Math.round(u * 0.8) + 1, 3, "#ffffff", d), i.rect(-1, A - Math.round(u * 0.4), 3, Math.round(u * 0.8) + 1, "#ffffff", d);
      break;
    }
    case "estallido":
      for (const u of n.chispas) {
        const d = u.v * frena(l);
        i.punto(Math.cos(u.a) * d, A + Math.sin(u.a) * d * 0.7 + 14 * l * l, l < 0.4 ? 2 : 1, u.claro ? o : r, 1 - l);
      }
      break;
    case "columna": {
      const u = Math.max(1, Math.round(12 * (1 - l)));
      i.sumar(true), i.rect(-Math.floor(u / 2), -132, u, 132, r, 0.55 * (1 - l)), i.rect(-Math.floor(u / 4), -132, Math.max(1, Math.floor(u / 2)), 132, o, 0.75 * (1 - l)), i.sumar(false);
      break;
    }
  }
}, particula = (i, e, s, a, n, r, o) => {
  if (a <= 1) {
    i.punto(e, s, 2, n, o);
    return;
  }
  if (a === 2) {
    i.punto(e, s, 3, n, o), i.punto(e, s, 1, r, o);
    return;
  }
  const l = Math.round(e), A = Math.round(s);
  i.rect(l - 2, A, 5, 1, n, o), i.rect(l, A - 2, 1, 5, n, o), i.rect(l - 1, A - 1, 3, 3, n, o), i.rect(l, A, 1, 1, r, o);
}, efectoDeReceta = (i, e, s) => {
  const a = normalizarReceta(e), n = parseInt(a.borde.slice(1), 16), r = a.colores.map((o) => aclarar(o, 0.55));
  return { id: i, color: n, estilo: { entry: a.estilo.entrada, exit: a.estilo.salida }, duracion: DURACION_RECETA, crear: (o) => ({ capas: a.capas.map((l) => MOV[l.mov].crear(o, l.n)), signo: Math.floor(o() * 5), grietas: Array.from({ length: 6 }, (l, A) => {
    const u = A * VUELTA / 6 + o() * 0.5, d = [];
    for (let h = 0; h < 9; h++)
      d.push([Math.round(Math.cos(u) * 2.6 + (o() - 0.5) * 2), Math.round(Math.sin(u) * 1.3 + (o() - 0.5) * 1.2)]);
    return { pasos: d };
  }), chispas: Array.from({ length: 14 }, (l, A) => ({ a: A * VUELTA / 14 + o() * 0.3, v: 14 + o() * 12, claro: o() < 0.45 })) }), dibujar: (o, l, A, u) => {
    const d = A === "entry";
    if (pintarSuelo(o, a, l, d, u), a.luz) {
      const h = tramo(l, 0, 250) * (1 - tramo(l, 1e3, 1400));
      o.sumar(true), o.luz(0, PECHO, 32, rgb(a.colores[0]), 0.22 * h, 1.5), o.sumar(false);
    }
    a.capas.forEach((h, m) => {
      const g = MOV[h.mov], p = u.capas[m] || [], f = a.colores[Math.min(h.color, a.colores.length - 1)], b = r[Math.min(h.color, r.length - 1)], E = h.pieza === -2, I = (E || h.pieza >= 0 && h.pieza < s.cuantas) && !!s.imagen, _ = h.tam >= 2 && h.n <= 4 ? 2 : 1;
      o.sumar(h.sumar), p.forEach((N, x) => {
        const R = g.pos(N, l, d, h.vel), y = E ? a.usar[x % a.usar.length] : h.pieza;
        if (h.estela && R)
          for (let v = 1; v <= 3; v++) {
            const S = g.pos(N, l - v * 34, d, h.vel);
            S && o.punto(S.x, S.y, v === 1 ? Math.min(2, h.tam) : 1, v === 1 ? b : f, S.a * (0.7 - v * 0.17));
          }
        R && (I ? (h.sumar && o.sumar(false), o.pieza(s.imagen, y * s.lado, 0, s.lado, s.lado, R.x, R.y, _, R.a, !!R.voltear), h.sumar && o.sumar(true)) : particula(o, R.x, R.y, h.tam, f, b, R.a)), g.extra && g.extra(o, N, l, d, h.vel, f, h.tam);
      }), o.sumar(false);
    }), pintarFinal(o, a, l, d, u), o.terminar();
  } };
};

// los de solo shader (sin partículas): color del borde y estilo 0
const DISOLVER = { 'dissolve': 0x1785FF, 'dissolve-violet': 0xBB55FF, 'dissolve-gold': 0xFFBC2F, 'phase': 0x10B981, 'warp': 0xA855F7, 'pixelate': 0x06B6D4 };

// la hoja de piezas de una receta (PNG de 4 piezas de 16 px en fila), compartida por URL
const HOJAS = new Map();
const hoja = (url) =>
{
    let h = HOJAS.get(url);

    if(h) return h;

    h = { imagen: null, lado: 16, cuantas: PIEZAS };

    if(url && (typeof Image !== 'undefined'))
    {
        const img = new Image();

        img.crossOrigin = 'anonymous';
        img.onload = () => { h.imagen = img; };
        img.src = url;
    }

    HOJAS.set(url, h);

    return h;
};

const RECETAS = new Map();

/**
 * Lo que hace un Splash, a partir de su spec: la clave de uno hecho a mano (portal, stars, blackhole, hologram,
 * fire, ice, sakura, bubbles), uno de solo shader (dissolve…) o una receta en JSON {"receta":{…},"imagen":url}.
 */
export class SplashMotor
{
    public static DURACION_SHADER = DURACION_DISOLVER;

    /** null si no es un Splash conocido */
    public static efecto(spec: string): { color: number, estilo: { entry: number, exit: number }, duracion: number, crear?: Function, dibujar?: Function }
    {
        if(!spec) return null;

        if(EFECTOS[spec]) return EFECTOS[spec];

        if(DISOLVER[spec] !== undefined) return { color: DISOLVER[spec], estilo: { entry: 0, exit: 0 }, duracion: DURACION_DISOLVER };

        if(spec.charAt(0) !== '{') return null;

        let efecto = RECETAS.get(spec);

        if(efecto) return efecto;

        try
        {
            const datos = JSON.parse(spec);

            efecto = efectoDeReceta(spec, datos.receta, hoja(datos.imagen));
        }
        catch(e)
        {
            return null;
        }

        RECETAS.set(spec, efecto);

        if(RECETAS.size > 60) RECETAS.delete(RECETAS.keys().next().value);

        return efecto;
    }

    /** si ya se puede pintar entero (una receta necesita su hoja de piezas cargada) */
    public static listo(spec: string): boolean
    {
        if(!spec || (spec.charAt(0) !== '{')) return true;

        try
        {
            const h = HOJAS.get(JSON.parse(spec).imagen);

            return !!(h && h.imagen);
        }
        catch(e)
        {
            return true;
        }
    }

    /** el mismo Splash sale igual en todas las pantallas: la semilla sale de la sala, el avatar y la fase */
    public static datos(efecto, roomId: number, objectId: number, fase: string): any
    {
        return (efecto && efecto.crear) ? efecto.crear(azar(semilla(roomId, objectId, fase))) : null;
    }

    /**
     * El shader de SplashFiltro en JavaScript, píxel a píxel (para las vistas previas en un lienzo 2D, donde no
     * hay Pixi): de src a dst, mismo tamaño. f de 0 a 1 por la duración del shader.
     */
    public static disolver(src: ImageData, dst: ImageData, entrar: boolean, f: number, segundos: number, estilo: number, color: number): void
    {
        const e = (f * f * (3 - (2 * f)));
        const progress = (entrar ? (0.72 * (1 - e)) : e);
        const tint = [ ((color >> 16) & 255) / 255, ((color >> 8) & 255) / 255, (color & 255) / 255 ];
        const hash = (x: number, y: number) => { const v = Math.sin((x * 127.1) + (y * 311.7)) * 43758.5453123; return v - Math.floor(v); };
        const fijar = (v: number, a: number, b: number) => ((v < a) ? a : ((v > b) ? b : v));
        const w = src.width, h = src.height, o = src.data, d = dst.data;

        for(let y = 0; y < h; y++)
        {
            for(let x = 0; x < w; x++)
            {
                const i = ((y * w) + x) * 4;
                const a = o[i + 3] / 255;

                if(a <= 0.001) { d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0; continue; }

                const u = (x + 0.5) / w, v = (y + 0.5) / h;
                const noise = hash(Math.floor(u * 32), Math.floor(v * 55));
                let threshold = fijar((v * 0.68) + (noise * 0.14), 0, 0.82);
                let celda = [ Math.floor(u * 32), Math.floor(v * 55) ], ruido = noise;
                let r = o[i] / 255, g = o[i + 1] / 255, b = o[i + 2] / 255;

                if(estilo > 3.5)
                {
                    const px = x + 0.5, py = y + 0.5;

                    celda = [ Math.floor(px / 2), Math.floor(py / 2) ];
                    ruido = hash(celda[0], celda[1]);

                    if(estilo < 4.5)
                    {
                        threshold = fijar((hash(Math.floor(py / 2), 7) * 0.68) + (ruido * 0.14), 0, 0.82);

                        if(progress > 0.02)
                        {
                            const fila = (0.78 + (0.22 * (Math.floor(py) % 2)));

                            r = ((r * 0.78) + (tint[0] * a * 0.22)) * fila; g = ((g * 0.78) + (tint[1] * a * 0.22)) * fila; b = ((b * 0.78) + (tint[2] * a * 0.22)) * fila;
                        }
                    }
                    else if(estilo < 5.5) threshold = fijar(((1 - v) * 0.68) + (ruido * 0.14), 0, 0.82);
                    else if(estilo < 6.5)
                    {
                        const rr = fijar(Math.hypot((u - 0.5) * 1.3, (v - 0.58)) * 1.6, 0, 1);

                        threshold = fijar(((1 - rr) * 0.68) + (ruido * 0.14), 0, 0.82);
                    }
                    else if(estilo < 7.5) threshold = fijar((hash(Math.floor(px / 6) + 3.7, Math.floor(py / 6) + 1.3) * 0.74) + (ruido * 0.06), 0, 0.82);
                    else if(estilo < 8.5) threshold = fijar((v * 0.68) + (ruido * 0.14), 0, 0.82);
                    else threshold = fijar(((((1 - u) * 0.5) + (v * 0.22)) * 0.95) + (ruido * 0.14), 0, 0.82);
                }

                let alfa = a;

                if(entrar)
                {
                    const borde = 1 - suave(fijar(Math.abs(progress - threshold) / 0.12, 0, 1));
                    const visible = (progress <= threshold) ? 1 : 0;

                    r = mezcla(r, mezcla(r * 0.56, tint[0], 0.72), borde); g = mezcla(g, mezcla(g * 0.56, tint[1], 0.72), borde); b = mezcla(b, mezcla(b * 0.56, tint[2], 0.72), borde);
                    alfa = a * Math.max(visible, borde * 0.92);
                }
                else if(progress > threshold)
                {
                    const edad = fijar((progress - threshold) / 0.48, 0, 1);
                    const brillo = Math.pow(Math.max(0, Math.sin((segundos * 7) + (ruido * 18))), 14);
                    const visible = (1 - edad) * ((hash(celda[0] + 19.3, celda[1] + 7.1) >= ((edad * 0.5) - 0.1)) ? 1 : 0);
                    const m = 0.18 + (brillo * 0.25);

                    // en el lienzo el color va sin premultiplicar: solo baja la opacidad
                    r = mezcla(r * 0.48, tint[0], m); g = mezcla(g * 0.48, tint[1], m); b = mezcla(b * 0.48, tint[2], m);
                    alfa = a * visible;
                }

                d[i] = fijar(r, 0, 1) * 255; d[i + 1] = fijar(g, 0, 1) * 255; d[i + 2] = fijar(b, 0, 1) * 255; d[i + 3] = alfa * 255;
            }
        }
    }

    /**
     * El icono de un Splash para su casilla, dibujado a propósito a escala 1 en un lienzo de 32 x 32 (nada reducido:
     * pixel art limpio). Los hechos a mano, con sus propias piezas; las recetas, dos piezas de su hoja a 16 px; los
     * de solo shader, null (los pinta la vista).
     */
    public static icono(spec: string, ctx: CanvasRenderingContext2D): boolean
    {
        const efecto = SplashMotor.efecto(spec);

        if(!efecto || !efecto.dibujar) return false;

        ctx.imageSmoothingEnabled = false;

        const en = (x: number, y: number) => new Pintor(ctx, x, y, 1);
        let i: any;

        try
        {
            switch(spec)
            {
                case 'portal':
                    i = en(16, 22);
                    i.elipse(0, 0, 13, 6.5, '#12042a', 0.9); i.elipse(0, 0, 9, 4.5, '#2e0a5c', 1); i.elipse(0, 0, 4, 2, '#7c3aed', 1);
                    i.anillo(0, 0, 13, 6.5, (u) => ((Math.floor(u / VUELTA * 24) % 3 === 0) ? '#22d3ee' : '#a855f7'), 1, 1);
                    i.punto(-7, -9, 1, '#67e8f9', 1); i.punto(2, -15, 2, '#d8b4fe', 1); i.punto(8, -7, 1, '#67e8f9', 1); i.punto(-2, -6, 1, '#f5d0fe', 1);
                    break;
                case 'stars':
                    i = en(16, 16);
                    estrellita(i, -7, -6, 2, 1); estrellita(i, 6, 3, 3, 1); estrellita(i, -4, 9, 1, 1); estrellita(i, 9, -9, 1, 1);
                    break;
                case 'blackhole':
                    i = en(16, 16);
                    i.anillo(0, 0, 13, 4, (u) => MORADOS[Math.floor(u / VUELTA * MORADOS.length) % MORADOS.length], 0.6, 1);
                    i.elipse(0, 0, 7, 7, '#040008', 1); i.anillo(0, 0, 7.5, 7.5, () => '#a855f7', 1, 1);
                    i.anillo(0, 0, 13, 4, (u) => ((Math.sin(u) > 0) ? MORADOS[Math.floor(u / VUELTA * MORADOS.length) % MORADOS.length] : 'rgba(0,0,0,0)'), 1, 1);
                    i.punto(-11, -9, 1, '#f5d0fe', 1); i.punto(10, 8, 1, '#7e22ce', 1);
                    break;
                case 'hologram':
                    i = en(16, 28);
                    i.sumar(true);
                    for(let y = 0; y > -24; y -= 2) i.rect(-8, y - 2, 16, 1, '#0e7490', 0.55 * (1 + (y / 40)));
                    i.sumar(false);
                    i.elipse(0, 0, 10, 4, '#062a36', 0.9); i.anillo(0, 0, 10, 4, () => '#67e8f9', 1, 1);
                    i.rect(-10, -15, 20, 1, '#cffafe', 1); i.rect(-10, -14, 20, 1, '#0891b2', 0.7);
                    i.rect(-6, -21, 5, 1, '#a5f3fc', 0.8); i.rect(2, -8, 4, 1, '#a5f3fc', 0.8);
                    break;
                case 'fire':
                    i = en(16, 29);
                    i.sumar(true); i.luz(0, -4, 14, [ 251, 146, 60 ], 0.5, 0.7); i.sumar(false);
                    lenguaFuego(i, -8, 0, 13, 5, 1); lenguaFuego(i, 7, 0, 15, 5, 1); lenguaFuego(i, 0, 0, 21, 7, 1);
                    i.punto(-4, -23, 1, '#fde047', 1); i.punto(6, -21, 1, '#f97316', 1);
                    break;
                case 'ice':
                    i = en(16, 29);
                    i.elipse(0, 0, 11, 3, '#bae6fd', 0.5);
                    i.rect(-8, -20, 8, 20, '#e0f2fe', 0.75); i.rect(0, -20, 8, 20, '#7dd3fc', 0.8);
                    i.rect(-8, -20, 1, 20, '#f0f9ff', 1); i.rect(7, -20, 1, 20, '#0ea5e9', 1); i.rect(0, -18, 1, 18, '#f0f9ff', 0.6);
                    for(const [ x, w, h ] of [ [ -8, 6, 5 ], [ -3, 6, 8 ], [ 3, 5, 4 ] ]) for(let k = 0; k < h; k++) { const f = Math.max(1, Math.round(w * (1 - (k / h)))); i.rect(x + Math.floor((w - f) / 2), -21 - k, f, 1, '#e0f2fe', 0.9); }
                    i.punto(-5, -14, 1, '#ffffff', 1); i.punto(-3, -11, 1, '#ffffff', 1); i.punto(-1, -8, 1, '#ffffff', 1);
                    break;
                case 'sakura':
                    i = en(16, 16);
                    // un remolino de pétalos
                    for(let k = 0; k < 8; k++) { const a = (k / 8) * VUELTA, r = 5 + (k * 1.3); petalo(i, Math.round(Math.cos(a) * r) - 2, Math.round(Math.sin(a) * r * 0.8) - 2, (k % 2) === 0, k % 3, 1); }
                    break;
                case 'bubbles':
                    i = en(16, 16);
                    i.elipse(-2, 0, 8, 8, '#bae6fd', 0.35); pompa(i, -2, 0, 9, 1); pompa(i, 10, -9, 3, 1); pompa(i, 10, 9, 2, 1); pompa(i, -12, -10, 2, 1);
                    break;
                default:
                {
                    // receta: dos piezas de su hoja a su tamaño (16 px)
                    const h = HOJAS.get(JSON.parse(spec).imagen);

                    if(!h || !h.imagen) return false;

                    ctx.drawImage(h.imagen, 0, 0, 16, 16, 2, 3, 16, 16);
                    ctx.drawImage(h.imagen, 16, 0, 16, 16, 14, 13, 16, 16);
                }
            }
        }
        finally
        {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }

        return true;
    }

    /** pinta las partículas en ctx con los pies en (x, y); escala 1 = sala a 64 */
    public static pintar(efecto, datos, ctx: CanvasRenderingContext2D, x: number, y: number, escala: number, t: number, fase: string): void
    {
        if(!efecto || !efecto.dibujar) return;

        ctx.imageSmoothingEnabled = false;

        try
        {
            efecto.dibujar(new Pintor(ctx, x, y, escala), t, fase, datos);
        }
        finally
        {
            ctx.globalAlpha = 1;
            ctx.globalCompositeOperation = 'source-over';
        }
    }
}
