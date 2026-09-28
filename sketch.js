// noprotect
// =====================================================================
//  VAHO · Pantalla A: la ventana
//  Ventana de vidrio repartido, nueve paños, una vela al fondo.
//  p5.js 2.x + ml5.js 1.x (handPose) + Web Audio (aliento)
// =====================================================================


// ---------------------------------------------------------------------
//  AJUSTES
//  Casi todo lo poético de la obra se decide acá.
// ---------------------------------------------------------------------
const CONFIG = {
  // Cámara
  nombreCamara: 'Facecam',  // se elige la cámara cuyo nombre contenga esta palabra (vacío = la predeterminada)
  anchoCamara: 960,         // 960 x 540 es una resolución propia de la Elgato Facecam MK.2
  altoCamara: 540,
  fpsCamara: 30,            // imágenes por segundo que se le piden a la cámara (30 o 60)

  // Rendimiento
  fps: 30,                  // 30 alcanza para proyección y alivia mucho la máquina
  intervaloManos: 10,       // ms de pausa entre una detección de manos y la siguiente (más alto = más liviano, más retraso)
  modeloManos: 'lite',      // 'lite' es más rápido, 'full' más preciso
  resolucionHabitacion: 0.5, // la habitación iluminada se prepara a media resolución

  // Ventana
  columnas: 3,
  filas: 3,
  margen: 0.05,             // margen arriba y abajo, proporción del alto de pantalla
  proporcionVentana: 0.8,   // ancho / alto de la ventana (menos de 1 = más alta que ancha)
  anchoTravesano: 12,       // travesaños entre paños, en px
  anchoMarco: 26,           // marco exterior, en px
  mostrarTravesanos: true,  // apagar si usan una ventana de madera real delante

  // Poemas
  tamTexto: 0.075,          // tamaño de letra, proporción del ancho de cada paño
  segundosLinea2: 4,        // segundos de cuidado sostenido para que aparezca la segunda línea
  segundosLinea3: 10,       // idem, la tercera
  claridadParaLeer: 0.45,   // cuánto tiene que estar limpio un escrito para contar como sostenido (0 a 1)
  olvidoPoema: 1.5,         // qué tan rápido se pierde lo sostenido cuando el vaho vuelve a cubrir
  dispersionEscritos: 0.6,  // cuánto se alejan los escritos del centro de su paño (siempre dentro del vidrio)
  inclinacionEscritos: 0.07, // cuánto se tuercen (en radianes)
  goteo: 1,                 // cantidad de chorreaduras del marcador (0 = ninguna)

  // Vela (posición relativa a la ventana: 0,0 arriba a la izquierda, 1,1 abajo a la derecha)
  vela: {
    x: 0.5,
    y: 0.9,
    tamLlama: 0.05,         // alto de la llama, proporción del alto de la ventana
    alcanceLuz: 0.95,       // hasta dónde ilumina la habitación
    intensidad: 0.6,
    parpadeo: 0.28,         // 0 = llama quieta, 0.5 = llama nerviosa
    luzEnVaho: 0.75,        // cuánto se enciende el vaho alrededor de la vela
  },

  // Vaho
  escalaVaho: 0.25,         // resolución del vaho respecto de la pantalla (más bajo = más suave y liviano)
  capaReempanado: 0.05,     // opacidad de cada capa de vaho que se deposita
  segundosMasAntigua: 5,    // en cuánto se cierra el paño de 1645
  segundosMasReciente: 80,  // en cuánto se cierra el paño de 1973
  factorHumedad: 1,         // gancho para los datos de Bichos sensores (1 = neutro, 2 = el doble de rápido)

  // Mano
  tamanoMano: 1,            // agranda o achica la huella de la mano (1 = tal como la ve la cámara)
  tamanoManoMouse: 62,      // tamaño de la mano de prueba que sigue al mouse
  grosorDedos: 0.34,        // grosor de los dedos respecto del ancho de la palma
  bordeHuella: 0.6,         // suavidad del borde de la huella (0 = borde duro)
  suavizadoMano: 0.6,       // 0 a 1, más alto = sigue más rápido a la mano (y tiembla un poco más)
  anticipacion: 60,         // ms que la huella se adelanta al último movimiento detectado (0 = sin anticipar)
  // Qué parte de la imagen de la cámara se usa para cubrir toda la ventana.
  zonaCamara: { x0: 0.2, x1: 0.8, y0: 0.08, y1: 0.85 },

  // Aliento
  umbralAliento: 0.035,     // calibrar con la tecla d mirando la barra de micrófono
  gananciaAliento: 1.2,

  // Presencia y escritura desde adentro
  umbralMovimiento: 14,
  memoriaPresencia: 3,
  esperaFantasma: 8,
  duracionFrase: 9,
  sostenerFrase: 5,
  pausaEntreFrases: 6,
  sostenPorEscritura: 0.12,

  // Desgaste
  desgastePorMutacion: 2000,
  umbralGota: 900,

  // Reflejo de quien mira
  opacidadReflejo: 0.14,    // 0 apaga el reflejo
};

// Valores de fábrica, para poder volver a ellos desde el panel
const CONFIG_ORIGINAL = JSON.parse(JSON.stringify(CONFIG));


// Letra de cada época. Se puede cambiar la fuente, el color de tinta y el desgaste.
//   escala: corrige el tamaño aparente de cada fuente
//   desgaste: 0 = tinta intacta, 1 = muy gastada
//   temblor: irregularidad de la línea de base
//   variacionTinta: diferencia de intensidad entre letras (máquina de escribir)
const ESTILOS_LETRA = {
  marcador:   { fuente: '"Caveat Brush", "Caveat", cursive', estilo: 'normal', escala: 1.3, tinta: [244, 240, 230], desgaste: 0.12, temblor: 0.05, variacionTinta: 0.12, marcador: true },
  parroquial: { fuente: '"IM Fell DW Pica", Georgia, serif', estilo: 'italic', escala: 1.15, tinta: [74, 46, 26], desgaste: 0.45, temblor: 0.05, variacionTinta: 0.25 },
  antigua:    { fuente: '"IM Fell English", Georgia, serif', estilo: 'italic', escala: 1.15, tinta: [68, 44, 28], desgaste: 0.42, temblor: 0.04, variacionTinta: 0.2 },
  pluma:      { fuente: '"Pinyon Script", cursive', estilo: 'normal', escala: 1.45, tinta: [52, 34, 38], desgaste: 0.3, temblor: 0.02, variacionTinta: 0.15 },
  caligrafia: { fuente: '"Mrs Saint Delafield", cursive', estilo: 'normal', escala: 1.8, tinta: [42, 32, 46], desgaste: 0.2, temblor: 0.02, variacionTinta: 0.12 },
  escolar:    { fuente: '"La Belle Aurore", cursive', estilo: 'normal', escala: 1.2, tinta: [36, 40, 76], desgaste: 0.12, temblor: 0.03, variacionTinta: 0.1 },
  manuscrita: { fuente: '"Homemade Apple", cursive', estilo: 'normal', escala: 0.9, tinta: [34, 38, 70], desgaste: 0.06, temblor: 0.03, variacionTinta: 0.08 },
  maquina:    { fuente: '"Special Elite", "Courier New", monospace', estilo: 'normal', escala: 0.95, tinta: [32, 30, 30], desgaste: 0.05, temblor: 0.04, variacionTinta: 0.35 },
};

// ---------------------------------------------------------------------
//  LAS NUEVE MUJERES
//  Los poemas están divididos en tres partes: el llamado, el gesto y el cierre.
//  El orden es de lectura: de izquierda a derecha y de arriba hacia abajo.
//  anio: número que define el ritmo del paño.
//  etiqueta: referencia interna del año (no se muestra en la obra).
//  letra: una de las claves de ESTILOS_LETRA ('marcador' es la mano de hoy;
//         las otras son letras de época, por si se quiere volver a ellas).
//  haiku: tres partes. La primera aparece al limpiar, las otras con cuidado sostenido.
//         Cada parte puede ocupar varios renglones: el corte lo hace el programa.
// ---------------------------------------------------------------------
const MUJERES = [
  { nombre: 'Nombre', anio: 1645, etiqueta: '1645', letra: 'marcador',
    haiku: [
      'Raíz mía que nunca vi,',
      'entra en la maceta del balcón y empuja la tierra',
      'hasta que el cemento se acuerde de ti.',
    ],
    fantasma: ['¿quién respira?', 'sigo aquí'] },
  { nombre: 'Nombre', anio: 1686, etiqueta: '1686', letra: 'marcador',
    haiku: [
      'Madre de mi padre,',
      'acuéstate un rato en la hamaca del corredor',
      'y déjame mecerte con el pie, como hacías tú con las tardes.',
    ],
    fantasma: ['acércate', 'del otro lado'] },
  { nombre: 'Nombre', anio: 1727, etiqueta: '1727', letra: 'marcador',
    haiku: [
      'Tú, que me debes una conversación,',
      'siéntate en la silla de plástico del patio y habla primero,',
      'que yo ya esperé bastante.',
    ],
    fantasma: ['escríbeme el nombre', 'una vez'] },
  { nombre: 'Nombre', anio: 1768, etiqueta: '1768', letra: 'marcador',
    haiku: [
      'Muertos chiquitos,',
      'jueguen en el patio de luces',
      'y apaguen un foco cada vez que se rían.',
    ],
    fantasma: ['no limpies tan fuerte', 'el río'] },
  { nombre: 'Nombre', anio: 1809, etiqueta: '1809', letra: 'marcador',
    haiku: [
      'Tú, que eras de agua dulce,',
      'desemboca en el río marrón y ancho,',
      'hasta que yo aprenda a nadar.',
    ],
    fantasma: ['letra chica', 'léeme despacio'] },
  { nombre: 'Nombre', anio: 1850, etiqueta: '1850', letra: 'marcador',
    haiku: [
      'Echa raíz en el árbol del fondo',
      'y suelta tus flores amarillas',
      'sobre la cabeza de quien pase distraído.',
    ],
    fantasma: ['la neblina', 'cierra la puerta'] },
  { nombre: 'Nombre', anio: 1891, etiqueta: '1891', letra: 'marcador',
    haiku: [
      'Muerte, nodriza de todos ellos,',
      'tráelos de la mano hasta el umbral de esta sala',
      'y después vete, que la luz la apago yo.',
    ],
    fantasma: ['ya es tarde', 'no apagues la vela'] },
  { nombre: 'Nombre', anio: 1932, etiqueta: '1932', letra: 'marcador',
    haiku: [
      'Ustedes, los que ya no tienen cara,',
      'entren al espejo del zaguán',
      'y préstense la mía por esta noche.',
    ],
    fantasma: ['hace calor', 'te estaba escribiendo'] },
  { nombre: 'Nombre', anio: 1973, etiqueta: '1973', letra: 'marcador',
    haiku: [
      'Suban la cuesta del humo',
      'y siéntense en mi cocina,',
      'que el fogón las reconoce por el olor del chocolate.',
    ],
    fantasma: ['no me leas toda', 'mañana llueve'] },
];


// ---------------------------------------------------------------------
//  ESTADO
// ---------------------------------------------------------------------
let W, H, marco;
let vidrios = [];
let vaho, vahoVisible, texturaVaho, texturaPared;
let video, handPose, manos = [];
// Para medir la detección y anticipar el movimiento
let manosAnteriores = [], tiempoManos = 0, tiempoManosAnteriores = 0;
let msDeteccion = 0, deteccionesPorSegundo = 0, contadorDetecciones = 0, inicioConteo = 0;
let chico, chicoCtx, chicoPrevio, movimiento = 0;
let reflejo, reflejoCtx;
let habitacionBase, spritePincel;
let analizador, datosAudio, nivelCrudo = 0, nivelAliento = 0, simulandoAliento = false;
let manosPrevias = [];
let ultimaPresencia = -999;
let fantasma = null, proximoFantasma = 0;
let gotas = [];
let mapaDesgaste, columnasDesgaste;
const CELDA = 50;
let depurar = false;
let estadoManos = 'sin iniciar';
// Vigilancia: la obra se recupera sola si algo se cae
let ultimoError = '', erroresDeDibujo = 0;
let generacionManos = 0, ultimaDeteccion = 0, reiniciandoManos = false, reiniciosManos = 0;
let reiniciosCamara = 0, esperaTamano = null, reabriendoCamara = false;
let nombreCamaraEnUso = 'predeterminada';
let avisoGrafico = '';
let llama = { x: 0, y: 0, brillo: 1 };

const FUENTE_DEDO = '"Caveat", "Bradley Hand", cursive';
const URL_FUENTES = 'https://fonts.googleapis.com/css2?family=IM+Fell+DW+Pica:ital@0;1&family=IM+Fell+English:ital@0;1&family=Pinyon+Script&family=Mrs+Saint+Delafield&family=La+Belle+Aurore&family=Homemade+Apple&family=Special+Elite&family=Caveat+Brush&family=Caveat:wght@600&display=swap';
let escritos = [];


// ---------------------------------------------------------------------
//  INICIO
// ---------------------------------------------------------------------
// Restos de una ejecución anterior de la placa de video: se ignoran
window.addEventListener('unhandledrejection', e => {
  const texto = String(e.reason && (e.reason.message || e.reason));
  if (texto.includes('mapAsync') || texto.includes('GPUBuffer')) e.preventDefault();
});

async function setup() {
  cargarAjustesGuardados();
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRate(CONFIG.fps);
  noCursor();

  await cargarFuentes();
  construirVentana();
  crearPanel();
  await iniciarCamara();
  await iniciarManos();

  document.getElementById('inicio').addEventListener('click', iniciarConClic);
}

// Al hacer clic en la obra, el teclado vuelve a ella (y no al editor de código)
window.addEventListener('pointerdown', () => { try { window.focus(); } catch (e) {} });

async function iniciarConClic() {
  document.getElementById('inicio').style.display = 'none';
  await iniciarMicrofono();
}

async function cargarFuentes() {
  try {
    // Las fuentes de los poemas se piden desde acá, así el index.html no cambia
    await new Promise(listo => {
      const enlace = document.createElement('link');
      enlace.rel = 'stylesheet';
      enlace.href = URL_FUENTES;
      enlace.onload = listo;
      enlace.onerror = listo;
      document.head.appendChild(enlace);
      setTimeout(listo, 5000);
    });
    const pedidos = Object.values(ESTILOS_LETRA).map(e => document.fonts.load(`${e.estilo} 400 32px ${e.fuente}`));
    pedidos.push(document.fonts.load(`600 48px ${FUENTE_DEDO}`));
    await Promise.all(pedidos);
  } catch (e) {
    console.warn('Las fuentes no cargaron, se usan las del sistema.', e);
  }
}

// Abre la cámara directamente, sin pasar por p5, para poder elegir cuál.
// Busca la que tenga en su nombre la palabra de CONFIG.nombreCamara
// (por ejemplo, la Elgato) y así no depende de la que prefiera el navegador.
let camarasEncontradas = [];
let fpsRealCamara = 0, ajustesCamara = null;

// Cuenta cuántas imágenes nuevas entrega de verdad la cámara por segundo
function medirImagenesDeCamara(elemento) {
  let cuenta = 0, desde = performance.now();
  const alRecibir = () => {
    cuenta++;
    const ahora = performance.now();
    if (ahora - desde >= 1000) {
      fpsRealCamara = cuenta * 1000 / (ahora - desde);
      cuenta = 0;
      desde = ahora;
    }
    elemento.requestVideoFrameCallback(alRecibir);
  };
  if (elemento.requestVideoFrameCallback) elemento.requestVideoFrameCallback(alRecibir);
}

async function reabrirCamara() {
  if (reabriendoCamara) return;
  reabriendoCamara = true;
  reiniciosCamara++;
  console.warn('La cámara se detuvo. Reabriéndola.');
  if (video && video.elt) {
    const viejo = video.elt.srcObject;
    if (viejo) viejo.getTracks().forEach(t => t.stop());
    video.elt.remove();
  }
  await new Promise(r => setTimeout(r, 800));
  await iniciarCamara();
  reabriendoCamara = false;
}

async function iniciarCamara() {
  const pedido = {
    width: { ideal: CONFIG.anchoCamara },
    height: { ideal: CONFIG.altoCamara },
    frameRate: { ideal: CONFIG.fpsCamara },
  };
  let flujo = null;
  try {
    // Primer permiso: sin él, el navegador no muestra los nombres de las cámaras
    const permiso = await navigator.mediaDevices.getUserMedia({ video: true });
    permiso.getTracks().forEach(t => t.stop());
    const dispositivos = await navigator.mediaDevices.enumerateDevices();
    const camaras = dispositivos.filter(d => d.kind === 'videoinput');
    camarasEncontradas = camaras.map(c => c.label || 'sin nombre');
    const buscada = (CONFIG.nombreCamara || '').toLowerCase();
    const elegida = buscada ? camaras.find(c => c.label.toLowerCase().includes(buscada)) : null;
    if (elegida) {
      flujo = await navigator.mediaDevices.getUserMedia({ video: { ...pedido, deviceId: { exact: elegida.deviceId } }, audio: false });
    } else {
      if (buscada) console.warn(`No encontré "${CONFIG.nombreCamara}". Cámaras disponibles:`, camarasEncontradas);
      flujo = await navigator.mediaDevices.getUserMedia({ video: pedido, audio: false });
    }
    const pista = flujo.getVideoTracks()[0];
    nombreCamaraEnUso = pista ? pista.label : 'sin cámara';
    // Si la cámara se desconecta o el sistema la suelta, se vuelve a abrir
    if (pista) pista.addEventListener('ended', reabrirCamara);
  } catch (e) {
    console.warn('No se pudo abrir la cámara.', e);
    nombreCamaraEnUso = 'sin cámara (' + e.name + ')';
  }

  // Elemento de video propio, oculto
  const elemento = document.createElement('video');
  elemento.muted = true;
  elemento.playsInline = true;
  elemento.autoplay = true;
  elemento.style.display = 'none';
  document.body.appendChild(elemento);
  if (flujo) {
    elemento.srcObject = flujo;
    elemento.play().catch(() => {});
  }
  video = { elt: elemento };
  if (flujo) {
    const pista = flujo.getVideoTracks()[0];
    ajustesCamara = pista && pista.getSettings ? pista.getSettings() : null;
    medirImagenesDeCamara(elemento);
  }

  // Lienzos chicos fuera de p5: leerlos es rápido
  chico = document.createElement('canvas');
  chico.width = 64;
  chico.height = 36;
  chicoCtx = chico.getContext('2d', { willReadFrequently: true });
  reflejo = document.createElement('canvas');
  reflejo.width = 192;
  reflejo.height = 108;
  reflejoCtx = reflejo.getContext('2d');
}

async function iniciarManos() {
  if (typeof ml5 === 'undefined') {
    estadoManos = 'ml5 no cargó (revisar internet o el index.html)';
    console.warn('ml5 no está disponible. Se puede limpiar con el mouse.');
    return;
  }
  // Sin aceleración gráfica la detección de manos congela todo: mejor no cargarla
  if (!hayWebGL()) {
    avisoGrafico = 'El navegador no tiene aceleración gráfica activada. Solo mouse.';
    estadoManos = 'apagada: la placa de video está desactivada (ver chrome://gpu)';
    console.warn(avisoGrafico);
    return;
  }
  try {
    if (typeof ml5.setBackend === 'function') await ml5.setBackend('webgl');
  } catch (e) {
    console.warn('No se pudo elegir WebGL para ml5.', e);
  }
  try {
    estadoManos = 'cargando el modelo…';
    handPose = await ml5.handPose({ maxHands: 4, flipped: false, modelType: CONFIG.modeloManos });
    estadoManos = 'funcionando (ml5 ' + (ml5.version || '') + ')';
    generacionManos++;
    ultimaDeteccion = performance.now();
    detectarManosEnBucle(generacionManos);
  } catch (e) {
    estadoManos = 'no pudo cargar el modelo: ' + (e && e.message ? e.message : e);
    ultimoError = 'manos: ' + (e && e.message ? e.message : e);
    console.warn('handPose no pudo iniciar. Se puede limpiar con el mouse.', e);
  }
}

// Si la detección de manos deja de responder (por ejemplo, porque la placa
// de video se reinició), se vuelve a cargar el modelo sin recargar la página
async function reiniciarManos() {
  if (reiniciandoManos) return;
  reiniciandoManos = true;
  reiniciosManos++;
  console.warn('La detección de manos dejó de responder. Reiniciando.');
  generacionManos++;          // el bucle anterior se detiene solo
  manos = [];
  handPose = null;
  await iniciarManos();
  reiniciandoManos = false;
  // Si no pudo volver a cargarse, lo intenta de nuevo en unos segundos
  if (!handPose && typeof ml5 !== 'undefined') setTimeout(reiniciarManos, 5000);
}

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) {
    return false;
  }
}

// Detecta manos a un ritmo fijo y deja libre el resto del tiempo para dibujar
async function detectarManosEnBucle(generacion) {
  if (generacion !== generacionManos) return;   // hay un bucle más nuevo
  let fallo = false;
  try {
    if (videoListo() && handPose) {
      const t0 = performance.now();
      const resultado = await handPose.detect(video.elt);
      if (generacion !== generacionManos) return;
      const t1 = performance.now();
      manosAnteriores = manos;
      tiempoManosAnteriores = tiempoManos;
      manos = resultado || [];
      tiempoManos = t1;
      // Medición: cuánto tarda cada detección y cuántas hay por segundo
      msDeteccion = lerp(msDeteccion || (t1 - t0), t1 - t0, 0.1);
      contadorDetecciones++;
      if (t1 - inicioConteo > 1000) {
        deteccionesPorSegundo = contadorDetecciones * 1000 / (t1 - inicioConteo);
        contadorDetecciones = 0;
        inicioConteo = t1;
      }
    }
    ultimaDeteccion = performance.now();
  } catch (e) {
    fallo = true;
    manos = [];
    ultimoError = 'manos: ' + (e && e.message ? e.message : e);
  }
  if (fallo) {
    reiniciarManos();
    return;
  }
  setTimeout(() => detectarManosEnBucle(generacion), CONFIG.intervaloManos);
}

// Estima dónde está la mano ahora, a partir de cómo venía moviéndose
// entre las dos últimas detecciones. Compensa parte del retraso.
function anticipar(puntos) {
  if (!CONFIG.anticipacion || !manosAnteriores.length) return puntos;
  const lapso = tiempoManos - tiempoManosAnteriores;
  if (lapso <= 0 || lapso > 400) return puntos;
  let anterior = null, menor = 80;
  for (const m of manosAnteriores) {
    const k = m.keypoints;
    if (!k || k.length < 21) continue;
    const d = Math.hypot(k[0].x - puntos[0].x, k[0].y - puntos[0].y);
    if (d < menor) { menor = d; anterior = k; }
  }
  if (!anterior) return puntos;
  const factor = min(1, CONFIG.anticipacion / lapso);
  return puntos.map((q, i) => ({ x: q.x + (q.x - anterior[i].x) * factor, y: q.y + (q.y - anterior[i].y) * factor }));
}

async function iniciarMicrofono() {
  try {
    const flujo = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    const ctxAudio = new (window.AudioContext || window.webkitAudioContext)();
    await ctxAudio.resume();
    const fuente = ctxAudio.createMediaStreamSource(flujo);
    const filtro = ctxAudio.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = 600;
    filtro.Q.value = 0.5;
    analizador = ctxAudio.createAnalyser();
    analizador.fftSize = 1024;
    fuente.connect(filtro);
    filtro.connect(analizador);
    datosAudio = new Float32Array(analizador.fftSize);
  } catch (e) {
    console.warn('Sin micrófono. La tecla b simula el aliento.', e);
  }
}


// ---------------------------------------------------------------------
//  CONSTRUCCIÓN DE LA VENTANA
// ---------------------------------------------------------------------
function construirVentana() {
  W = width;
  H = height;

  // Ventana centrada, más alta que ancha
  const altoMax = H * (1 - 2 * CONFIG.margen);
  const anchoMax = W * 0.9;
  let alto = altoMax;
  let ancho = alto * CONFIG.proporcionVentana;
  if (ancho > anchoMax) { ancho = anchoMax; alto = ancho / CONFIG.proporcionVentana; }

  const b = CONFIG.anchoTravesano;
  const anchoVidrio = (ancho - b * (CONFIG.columnas - 1)) / CONFIG.columnas;
  const altoVidrio = (alto - b * (CONFIG.filas - 1)) / CONFIG.filas;
  marco = { x: (W - ancho) / 2, y: (H - alto) / 2, w: ancho, h: alto, anchoVidrio, altoVidrio };

  llama.x = marco.x + CONFIG.vela.x * marco.w;
  llama.y = marco.y + CONFIG.vela.y * marco.h;

  const cantidad = min(MUJERES.length, CONFIG.columnas * CONFIG.filas);
  vidrios = [];
  for (let i = 0; i < cantidad; i++) {
    const mujer = MUJERES[i];
    const c = i % CONFIG.columnas;
    const f = floor(i / CONFIG.columnas);
    const t = constrain((mujer.anio - 1645) / (1973 - 1645), 0, 1);
    const segundos = segundosPara(t);

    const v = {
      i, mujer, t, segundos,
      x: marco.x + c * (anchoVidrio + b),
      y: marco.y + f * (altoVidrio + b),
      w: anchoVidrio,
      h: altoVidrio,
      acumulado: 0,
      desgaste: 0,
      sosten: 1,
    };
    vidrios.push(v);
  }

  // Se calcula a un cuarto de resolución: es una superficie difusa y así carga rápido
  texturaPared = crearTexturaPared(ceil(marco.w * 0.25), ceil(marco.h * 0.25));
  habitacionBase = crearHabitacionBase();
  if (!spritePincel) spritePincel = crearSpritePincel();
  crearEscritos();

  vaho = crearLienzoLegible(ceil(W * CONFIG.escalaVaho), ceil(H * CONFIG.escalaVaho));
  vahoVisible = createGraphics(vaho.width, vaho.height);
  vahoVisible.pixelDensity(1);
  texturaVaho = crearTexturaVaho(vaho.width, vaho.height);
  empanarTodo();

  columnasDesgaste = ceil(W / CELDA);
  mapaDesgaste = new Float32Array(columnasDesgaste * ceil(H / CELDA));
  gotas = [];
  fantasma = null;
}

// Escala logarítmica: la distancia en el tiempo pesa más en las primeras generaciones
function segundosPara(t) {
  return exp(lerp(log(CONFIG.segundosMasAntigua), log(CONFIG.segundosMasReciente), t));
}

function destruirVentana() {
  for (const g of [vaho, vahoVisible, texturaVaho, texturaPared, habitacionBase]) if (g) g.remove();
}

// La luz de la vela sobre la pared se calcula una sola vez.
// En cada cuadro solo cambia su brillo.
function crearHabitacionBase() {
  const r = CONFIG.resolucionHabitacion;
  const g = createGraphics(ceil(marco.w * r), ceil(marco.h * r));
  g.pixelDensity(1);
  const ctx = g.drawingContext;
  const cfg = CONFIG.vela;
  const lx = (llama.x - marco.x) * r;
  const ly = (llama.y - marco.y - marco.h * cfg.tamLlama * 0.6) * r;
  const alcance = marco.h * cfg.alcanceLuz * r;
  const i = cfg.intensidad;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, g.width, g.height);
  const luz = ctx.createRadialGradient(lx, ly, 0, lx, ly, alcance);
  luz.addColorStop(0, `rgba(255, 196, 130, ${0.95 * i})`);
  luz.addColorStop(0.18, `rgba(225, 140, 75, ${0.55 * i})`);
  luz.addColorStop(0.55, `rgba(120, 62, 30, ${0.22 * i})`);
  luz.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = luz;
  ctx.fillRect(0, 0, g.width, g.height);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(texturaPared.drawingContext.canvas, 0, 0, g.width, g.height);
  ctx.globalCompositeOperation = 'source-over';
  return g;
}

// Pincel suave dibujado una sola vez y reutilizado en cada toque
function crearSpritePincel() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.8)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);
  return c;
}

// Superficie de la habitación: revoque irregular, esquinas más oscuras.
// Se multiplica por la luz de la vela en cada cuadro.
function crearTexturaPared(w, h) {
  const g = createGraphics(w, h);
  g.pixelDensity(1);
  g.loadPixels();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const revoque = noise(x * 0.032 + 500, y * 0.032) * 0.6 + noise(x * 0.2, y * 0.2 + 500) * 0.4;
      const nx = x / w - 0.5, ny = y / h - 0.5;
      const vineta = 1 - constrain(sqrt(nx * nx + ny * ny) * 1.3, 0, 1) * 0.6;
      const v = (120 + revoque * 120) * vineta;
      const k = 4 * (x + y * w);
      g.pixels[k] = v;
      g.pixels[k + 1] = v * 0.94;
      g.pixels[k + 2] = v * 0.86;
      g.pixels[k + 3] = 255;
    }
  }
  g.updatePixels();
  return g;
}

// Textura del vaho: niebla fría e irregular con microgotas.
// La vela la entibia desde atrás en cada cuadro.
function crearTexturaVaho(w, h) {
  const g = createGraphics(w, h);
  g.pixelDensity(1);
  g.loadPixels();
  noiseDetail(4, 0.5);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const grande = noise(x * 0.02, y * 0.02);
      const fino = noise(x * 0.15 + 100, y * 0.15);
      const luz = 95 + grande * 60 + fino * 14;
      const k = 4 * (x + y * w);
      g.pixels[k] = luz * 0.92;
      g.pixels[k + 1] = luz * 0.96;
      g.pixels[k + 2] = luz;
      g.pixels[k + 3] = 255;
    }
  }
  g.updatePixels();

  g.noStroke();
  const cantidadGotitas = w * h * 0.004;
  for (let n = 0; n < cantidadGotitas; n++) {
    const x = random(w), y = random(h), r = random(0.6, 1.8);
    g.fill(215, 222, 230, random(40, 110));
    g.circle(x, y, r * 2);
    g.fill(60, 64, 72, random(20, 60));
    g.circle(x + r * 0.4, y + r * 0.5, r * 1.2);
  }
  return g;
}

function empanarTodo() {
  const ctx = vaho.drawingContext;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(texturaVaho.drawingContext.canvas, 0, 0);
  ctx.restore();
}


// ---------------------------------------------------------------------
//  ESCRITOS EN EL VIDRIO
//  Cada haiku está escrito con marcador en el vidrio de su paño, del lado
//  de adentro. El vaho se forma del lado de afuera: por eso hay que limpiar
//  para leer. Todo lo que es azar (lugar, inclinación, chorreaduras) sale
//  de una semilla fija, así cada escrito es siempre el mismo.
// ---------------------------------------------------------------------
function azarConSemilla(semilla) {
  let a = semilla >>> 0;
  return () => {
    a += 0x6D2B79F5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Lienzo común (fuera de p5) que se puede leer píxel a píxel sin costo extra
function crearLienzoLegible(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { drawingContext: c.getContext('2d', { willReadFrequently: true }), width: w, height: h, remove() {} };
}

function crearEscritos() {
  escritos = vidrios.map(v => crearEscrito(v));
  for (const e of escritos) calcularLuzEscrito(e);
}

function crearEscrito(v) {
  const azar = azarConSemilla(v.i * 7919 + 13);
  const est = ESTILOS_LETRA[v.mujer.letra] || ESTILOS_LETRA.marcador;
  const lineasTexto = (v.mujer.haiku || ['', '', '']).slice(0, 3);
  while (lineasTexto.length < 3) lineasTexto.push('');
  const sangrias = [0, 0.4 + azar() * 0.5, 0.15 + azar() * 0.35];
  const medir = document.createElement('canvas').getContext('2d');
  const fuente = t => `${est.estilo} 400 ${t}px ${est.fuente}`;

  // ¿La vela está en este vidrio? Entonces el escrito tiene que caber arriba de la llama
  const altoLlama = marco.h * CONFIG.vela.tamLlama;
  const velaAqui = llama.x > v.x && llama.x < v.x + v.w && llama.y > v.y && llama.y < v.y + v.h + altoLlama * 3;
  const altoDisponible = velaAqui
    ? max(v.h * 0.55, llama.y - altoLlama * 1.8 - v.y - 8)
    : v.h * 0.86;
  const anchoDisponible = v.w * 0.9;

  // Busca el tamaño de letra más grande con el que el poema entra en el vidrio
  let tam = max(12, v.w * CONFIG.tamTexto * est.escala);
  let bloques, pad, interlineado, separacion, h;
  for (let intento = 0; intento < 24; intento++) {
    medir.font = fuente(tam);
    pad = tam * 0.35;
    interlineado = tam * 1.18;
    separacion = tam * 0.3;
    bloques = lineasTexto.map((texto, k) => partirEnLineas(medir, texto, anchoDisponible - pad * 2 - sangrias[k] * tam));
    const filas = bloques.reduce((n, b) => n + b.length, 0);
    h = pad * 2 + filas * interlineado + separacion * 2;
    if (h <= altoDisponible || tam < 11) break;
    tam *= 0.93;
  }
  medir.font = fuente(tam);
  const anchoMax = max(...bloques.map((b, k) => max(0, ...b.map(f => medir.measureText(f).width)) + sangrias[k] * tam));
  const w = anchoMax + pad * 2;
  const extraAbajo = tam * 1.8;   // lugar para las chorreaduras

  // Lugar dentro del vidrio: el marcador no puede cruzar el travesaño
  const libreX = max(0, v.w - w - 8), libreY = max(0, v.h - h - extraAbajo * 0.5 - 8);
  const d = CONFIG.dispersionEscritos;
  let cx = v.x + 4 + w / 2 + libreX * (0.5 + (azar() - 0.5) * d);
  let cy = v.y + 4 + h / 2 + libreY * (0.5 + (azar() - 0.5) * d);
  const ang = (azar() - 0.5) * 2 * CONFIG.inclinacionEscritos;

  // En el paño de la vela, el escrito se corre hacia arriba para no tapar la llama
  if (velaAqui && cy + h / 2 > llama.y - altoLlama * 1.8) {
    cy = max(v.y + h / 2 + 4, llama.y - altoLlama * 1.8 - h / 2);
  }

  const e = {
    i: v.i, v, mujer: v.mujer, estilo: est, t: v.t,
    cx, cy, ang, w, h, tam, pad, extraAbajo,
    fuente: fuente(tam),
    claridad: 0, sostenido: 0,
  };

  let fila = 0;
  e.lineas = bloques.map((renglones, k) => {
    medir.font = e.fuente;
    const glifos = [];
    for (const renglon of renglones) {
      let x = pad + sangrias[k] * tam;
      const y = pad + tam * 0.95 + fila * interlineado + k * separacion;
      for (const ch of renglon) {
        glifos.push({
          ch, x, y, dy: 0,
          jy: (azar() - 0.5) * est.temblor * tam * 2,
          a: 1 - azar() * est.variacionTinta,
        });
        x += medir.measureText(ch).width;
      }
      fila++;
    }
    // Huecos donde el marcador no cargó tinta
    const manchas = [];
    const cantidad = floor(w * h * 0.004 * est.desgaste);
    for (let n = 0; n < cantidad; n++) {
      manchas.push({ x: azar() * w, y: azar() * h, r: 0.4 + azar() * (1 + est.desgaste * 2.5), a: 0.3 + azar() * 0.6 });
    }
    // Chorreaduras: la tinta que bajó desde el pie de alguna letra.
    // Solo en el último renglón del poema, para que no crucen las palabras de abajo.
    const goteos = [];
    if (est.marcador && k === bloques.length - 1) {
      const yUltimo = max(...glifos.map(g => g.y));
      const letras = glifos.filter(g => g.y === yUltimo && /\p{L}/u.test(g.ch));
      const cuantas = floor(azar() * 2.2 * CONFIG.goteo);
      for (let n = 0; n < cuantas && letras.length; n++) {
        const g = letras[floor(azar() * letras.length)];
        goteos.push({
          x: g.x + tam * (0.1 + azar() * 0.25),
          y: g.y + tam * 0.05,
          largo: tam * (0.3 + azar() * 1.3),
          ancho: max(1.2, tam * (0.05 + azar() * 0.04)),
        });
      }
    }
    return { glifos, manchas, goteos, vetas: azar() * 1000, canvas: null, sucio: true, alfa: k === 0 ? 1 : 0 };
  });

  return e;
}

function calcularLuzEscrito(e) {
  const distancia = dist(e.cx, e.cy, llama.x, llama.y);
  e.cercania = constrain(1 - distancia / (marco.h * CONFIG.vela.alcanceLuz), 0, 1);
  // El color del trazo depende de cuánto lo alcanza la vela: se vuelven a dibujar
  for (const l of e.lineas) l.sucio = true;
}

// Color del marcador según la luz que le llega: gris frío lejos, blanco cálido cerca
function colorMarcador(e) {
  const frio = [168, 172, 180];
  const t = e.estilo.tinta;
  const calido = [min(255, t[0] + 8), t[1] - 6, t[2] - 28];
  const k = e.cercania;
  return frio.map((f, n) => round(lerp(f, calido[n], k)));
}

function lienzoEscrito(e) {
  const c = document.createElement('canvas');
  c.width = ceil(e.w);
  c.height = ceil(e.h + e.extraAbajo);
  return c;
}

// Cada línea del haiku en su propio lienzo, para que pueda aparecer sola
function dibujarLinea(e, l) {
  if (!l.canvas) l.canvas = lienzoEscrito(e);
  const ctx = l.canvas.getContext('2d');
  ctx.clearRect(0, 0, l.canvas.width, l.canvas.height);
  ctx.save();
  ctx.font = e.fuente;
  ctx.textBaseline = 'alphabetic';
  const col = e.estilo.marcador ? colorMarcador(e) : e.estilo.tinta;
  for (const g of l.glifos) {
    ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, ${g.a})`;
    ctx.fillText(g.ch, g.x, g.y + g.jy + g.dy);
  }
  // Chorreaduras: una línea fina que termina en una gota
  ctx.fillStyle = `rgba(${col[0]}, ${col[1]}, ${col[2]}, 0.85)`;
  for (const q of l.goteos) {
    ctx.fillRect(q.x - q.ancho / 2, q.y, q.ancho, q.largo);
    ctx.beginPath();
    ctx.ellipse(q.x, q.y + q.largo, q.ancho * 0.95, q.ancho * 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  // Vetas: el marcador de tiza deja el trazo rayado en el sentido de la escritura
  if (e.estilo.marcador) {
    const azar = azarConSemilla(floor(l.vetas));
    for (let y = 0; y < l.canvas.height; y += 1.5) {
      ctx.globalAlpha = azar() * 0.28;
      ctx.fillRect(0, y, l.canvas.width, 0.8);
    }
  }
  for (const q of l.manchas) {
    ctx.globalAlpha = q.a;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  l.sucio = false;
}

function dibujarEscritos() {
  const ctx = drawingContext;
  for (const e of escritos) {
    for (const l of e.lineas) if (l.sucio) dibujarLinea(e, l);
    const luz = (0.55 + 0.45 * e.cercania) * (0.85 + 0.15 * llama.brillo);
    ctx.save();
    // Cada escrito se recorta a su vidrio: el travesaño lo interrumpe
    ctx.beginPath();
    ctx.rect(e.v.x, e.v.y, e.v.w, e.v.h);
    ctx.clip();
    ctx.translate(e.cx, e.cy);
    ctx.rotate(e.ang);
    ctx.globalAlpha = luz;
    for (const l of e.lineas) {
      if (l.alfa < 0.01) continue;
      ctx.globalAlpha = luz * l.alfa;
      ctx.drawImage(l.canvas, -e.w / 2, -e.h / 2);
    }
    ctx.restore();
  }
}

// Pasa un punto de la pantalla a las coordenadas propias del escrito
function aLocal(e, x, y) {
  const dx = x - e.cx, dy = y - e.cy;
  const c = Math.cos(-e.ang), s = Math.sin(-e.ang);
  return { x: dx * c - dy * s + e.w / 2, y: dx * s + dy * c + e.h / 2 };
}

// Cuánto se ve cada escrito a través del vaho (0 = cubierto, 1 = limpio)
function medirClaridad() {
  const s = CONFIG.escalaVaho;
  const datos = vaho.drawingContext.getImageData(0, 0, vaho.width, vaho.height).data;
  for (const e of escritos) {
    const c = Math.cos(e.ang), sn = Math.sin(e.ang);
    let suma = 0, n = 0;
    for (let a = 0; a < 6; a++) {
      for (let b = 0; b < 4; b++) {
        const lx = ((a + 0.5) / 6 - 0.5) * e.w, ly = ((b + 0.5) / 4 - 0.5) * e.h;
        const fx = floor((e.cx + lx * c - ly * sn) * s);
        const fy = floor((e.cy + lx * sn + ly * c) * s);
        if (fx < 0 || fy < 0 || fx >= vaho.width || fy >= vaho.height) continue;
        suma += 1 - datos[4 * (fx + fy * vaho.width) + 3] / 255;
        n++;
      }
    }
    e.claridad = n ? suma / n : 0;
  }
}

// Las líneas dos y tres aparecen si alguien sostiene el escrito limpio
function actualizarPoemas(dt) {
  for (const e of escritos) {
    if (e.claridad > CONFIG.claridadParaLeer) e.sostenido += dt;
    else e.sostenido = max(0, e.sostenido - dt * CONFIG.olvidoPoema);
    e.sostenido = min(e.sostenido, CONFIG.segundosLinea3 + 4);
    const objetivos = [1, e.sostenido >= CONFIG.segundosLinea2 ? 1 : 0, e.sostenido >= CONFIG.segundosLinea3 ? 1 : 0];
    e.lineas.forEach((l, k) => { l.alfa += (objetivos[k] - l.alfa) * min(1, dt * 1.2); });
  }
}


// ---------------------------------------------------------------------
//  CICLO
// ---------------------------------------------------------------------
// Si algo falla en un cuadro, se anota y la obra sigue en el siguiente.
// Sin esta protección, p5 detiene todo ante el primer error.
function draw() {
  try {
    dibujarCuadro();
  } catch (e) {
    erroresDeDibujo++;
    ultimoError = 'dibujo: ' + (e && e.message ? e.message : e);
    console.error(e);
    try { drawingContext.restore(); } catch (e2) {}
  }
  vigilar();
}

function vigilar() {
  if (frameCount % 30 !== 0) return;
  const ahora = performance.now();
  // Detección de manos colgada: más de 4 segundos sin terminar ninguna
  if (handPose && videoListo() && !reiniciandoManos && ahora - ultimaDeteccion > 4000) reiniciarManos();
  // Cámara sin imagen: se reabre
  if (video && video.elt && video.elt.srcObject) {
    const pista = video.elt.srcObject.getVideoTracks()[0];
    if (pista && pista.readyState === 'ended' && !reabriendoCamara) reabrirCamara();
  }
}

function dibujarCuadro() {
  const dt = min(deltaTime / 1000, 0.1);
  const ahora = millis() / 1000;

  actualizarAliento();
  if (frameCount % 4 === 0) detectarMovimiento(ahora);

  const manosEnPantalla = obtenerManos();
  if (manosEnPantalla.length || nivelAliento > 0) ultimaPresencia = ahora;
  const hayPresencia = ahora - ultimaPresencia < CONFIG.memoriaPresencia;

  actualizarFantasma(ahora, dt, hayPresencia);
  reempanar(dt);
  limpiarConManos(manosEnPantalla, dt);
  actualizarGotas(dt);
  if (frameCount % 3 === 0) medirClaridad();
  actualizarPoemas(dt);

  // Composición, de atrás hacia adelante:
  // pared iluminada, vela, escritos en el vidrio, reflejo de quien mira, vaho, gotas, marco
  background(0);
  dibujarHabitacion(ahora);
  drawingContext.save();
  dibujarVela(drawingContext);
  drawingContext.restore();
  dibujarEscritos();
  dibujarReflejo();
  dibujarVaho();
  dibujarGotas();
  dibujarMarco();

  if (depurar) dibujarCalibracion(manosEnPantalla, hayPresencia);
}


// ---------------------------------------------------------------------
//  LA HABITACIÓN Y LA VELA
// ---------------------------------------------------------------------
function dibujarHabitacion(ahora) {
  const cfg = CONFIG.vela;
  const ctx = drawingContext;

  // Parpadeo: dos ritmos de ruido superpuestos, uno lento y uno nervioso
  const temblor = noise(ahora * 3.1) * 0.7 + noise(ahora * 11 + 50) * 0.3;
  llama.brillo = constrain(1 - cfg.parpadeo * temblor, 0.45, 1);
  llama.vaiven = (noise(ahora * 1.7 + 200) - 0.5);
  llama.estiramiento = 1 + (noise(ahora * 5 + 300) - 0.5) * 0.3;

  ctx.save();
  ctx.globalAlpha = llama.brillo;
  ctx.drawImage(habitacionBase.drawingContext.canvas, marco.x, marco.y, marco.w, marco.h);
  ctx.restore();
}

function dibujarVela(ctx) {
  const h = marco.h * CONFIG.vela.tamLlama;
  const b = llama.brillo;
  const cx = llama.x;
  const tope = llama.y;                 // donde termina la cera
  const anchoVela = h * 0.6;
  const altoVela = h * 3;

  // Cuerpo de cera, iluminado desde arriba
  const cera = ctx.createLinearGradient(0, tope, 0, tope + altoVela);
  cera.addColorStop(0, `rgba(${230 * b}, ${200 * b}, ${160 * b}, 1)`);
  cera.addColorStop(0.35, `rgba(${150 * b}, ${118 * b}, ${88 * b}, 1)`);
  cera.addColorStop(1, 'rgba(40, 28, 20, 1)');
  ctx.fillStyle = cera;
  ctx.fillRect(cx - anchoVela / 2, tope, anchoVela, altoVela);

  // Sombra lateral para darle volumen
  const volumen = ctx.createLinearGradient(cx - anchoVela / 2, 0, cx + anchoVela / 2, 0);
  volumen.addColorStop(0, 'rgba(0,0,0,0.45)');
  volumen.addColorStop(0.4, 'rgba(0,0,0,0)');
  volumen.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = volumen;
  ctx.fillRect(cx - anchoVela / 2, tope, anchoVela, altoVela);

  // Mecha
  const vaiven = llama.vaiven * h * 0.3;
  ctx.strokeStyle = 'rgba(25, 16, 10, 1)';
  ctx.lineWidth = max(1, h * 0.05);
  ctx.beginPath();
  ctx.moveTo(cx, tope);
  ctx.lineTo(cx + vaiven * 0.15, tope - h * 0.16);
  ctx.stroke();

  // Halo pequeño alrededor de la llama
  const fx = cx + vaiven * 0.5;
  const fy = tope - h * 0.55;
  const halo = ctx.createRadialGradient(fx, fy, 0, fx, fy, h * 1.8);
  halo.addColorStop(0, `rgba(255, 215, 150, ${0.55 * b})`);
  halo.addColorStop(1, 'rgba(255, 180, 100, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(fx - h * 2, fy - h * 2, h * 4, h * 4);

  // Llama en forma de gota
  const base = tope - h * 0.08;
  const puntaX = cx + vaiven;
  const puntaY = base - h * llama.estiramiento;
  const ancho = h * 0.22;
  ctx.beginPath();
  ctx.moveTo(puntaX, puntaY);
  ctx.bezierCurveTo(puntaX + ancho * 0.2, puntaY + h * 0.35, cx + ancho, base - h * 0.25, cx, base + h * 0.03);
  ctx.bezierCurveTo(cx - ancho, base - h * 0.25, puntaX - ancho * 0.2, puntaY + h * 0.35, puntaX, puntaY);
  const fuego = ctx.createLinearGradient(0, base, 0, puntaY);
  fuego.addColorStop(0, 'rgba(110, 140, 255, 0.55)');
  fuego.addColorStop(0.12, 'rgba(255, 246, 225, 1)');
  fuego.addColorStop(0.5, `rgba(255, 212, 125, ${0.95 * b})`);
  fuego.addColorStop(1, 'rgba(255, 140, 40, 0)');
  ctx.fillStyle = fuego;
  ctx.fill();

  // Corazón blanco de la llama
  ctx.fillStyle = `rgba(255, 252, 240, ${0.8 * b})`;
  ctx.beginPath();
  ctx.ellipse(cx + vaiven * 0.25, base - h * 0.28, ancho * 0.35, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();
}



// El vaho se entibia donde lo atraviesa la luz de la vela
function dibujarVaho() {
  const s = CONFIG.escalaVaho;
  const ctx = vahoVisible.drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(vaho.drawingContext.canvas, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  const fx = llama.x * s;
  const fy = (llama.y - marco.h * CONFIG.vela.tamLlama * 0.6) * s;
  const r = marco.h * CONFIG.vela.luzEnVaho * s;
  const b = llama.brillo;
  const tibio = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
  tibio.addColorStop(0, `rgba(255, 214, 150, ${0.8 * b})`);
  tibio.addColorStop(0.3, `rgba(235, 165, 100, ${0.4 * b})`);
  tibio.addColorStop(1, 'rgba(235, 165, 100, 0)');
  ctx.fillStyle = tibio;
  ctx.fillRect(0, 0, vahoVisible.width, vahoVisible.height);
  ctx.restore();
  image(vahoVisible, 0, 0, W, H);
}


// ---------------------------------------------------------------------
//  VAHO QUE VUELVE
// ---------------------------------------------------------------------
function reempanar(dt) {
  const s = CONFIG.escalaVaho;
  const ctx = vaho.drawingContext;
  const origen = texturaVaho.drawingContext.canvas;
  const capasHasta95 = Math.log(0.05) / Math.log(1 - CONFIG.capaReempanado);

  for (const v of vidrios) {
    const ritmo = (capasHasta95 / v.segundos) * CONFIG.factorHumedad * v.sosten;
    v.acumulado += ritmo * dt;
    let capas = 0;
    while (v.acumulado >= 1 && capas < 30) {
      v.acumulado -= 1;
      capas++;
    }
    v.acumulado = min(v.acumulado, 1);
    if (capas === 0) continue;

    ctx.save();
    ctx.globalAlpha = 1 - Math.pow(1 - CONFIG.capaReempanado, capas);
    ctx.drawImage(origen, v.x * s, v.y * s, v.w * s, v.h * s, v.x * s, v.y * s, v.w * s, v.h * s);
    ctx.restore();
  }

  if (nivelAliento > 0) {
    ctx.save();
    ctx.globalAlpha = constrain(nivelAliento * CONFIG.gananciaAliento * dt * 3, 0, 0.3);
    ctx.drawImage(origen, 0, 0);
    ctx.restore();
  }
}


// ---------------------------------------------------------------------
//  LIMPIAR
// ---------------------------------------------------------------------
function pincel(ctx, x, y, r, fuerza) {
  ctx.globalAlpha = fuerza;
  ctx.drawImage(spritePincel, x - r, y - r, r * 2, r * 2);
}

function borrarTrazo(x0, y0, x1, y1, r, fuerza) {
  const s = CONFIG.escalaVaho;
  const ctx = vaho.drawingContext;
  const largo = dist(x0, y0, x1, y1);
  const pasos = max(1, ceil(largo / (r * 0.35)));
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  for (let k = 0; k <= pasos; k++) {
    const t = k / pasos;
    pincel(ctx, lerp(x0, x1, t) * s, lerp(y0, y1, t) * s, r * s, fuerza);
  }
  ctx.restore();
  return largo;
}

// Cada mano deja su silueta en el vaho. Si se mueve rápido, se dibujan
// siluetas intermedias para que la huella no quede cortada.
function limpiarConManos(lista, dt) {
  const ctx = vaho.drawingContext;
  for (const m of lista) {
    const recorrido = dist(m.previo.centro.x, m.previo.centro.y, m.centro.x, m.centro.y);
    const largoPalma = max(10, dist(m.puntos[0].x, m.puntos[0].y, m.puntos[9].x, m.puntos[9].y));
    const pasos = constrain(ceil(recorrido / (largoPalma * 0.3)), 1, 6);
    for (let k = 1; k <= pasos; k++) {
      const t = k / pasos;
      const intermedios = m.puntos.map((q, i) => ({
        x: lerp(m.previo.puntos[i].x, q.x, t),
        y: lerp(m.previo.puntos[i].y, q.y, t),
      }));
      dibujarSiluetaMano(ctx, intermedios);
    }

    const v = vidrioEn(m.centro.x, m.centro.y);
    if (!v) continue;
    v.desgaste += recorrido;
    if (v.desgaste > CONFIG.desgastePorMutacion) {
      v.desgaste = 0;
      mutarLetra(m.centro.x, m.centro.y, largoPalma * 1.5);
    }
    sumarDesgasteLocal(m.centro.x, m.centro.y, recorrido);
  }
  const enfriado = Math.exp(-dt / 1.2);
  for (let k = 0; k < mapaDesgaste.length; k++) mapaDesgaste[k] *= enfriado;
}

// Numeración de handPose: 0 muñeca, 1 a 4 pulgar, 5 a 8 índice,
// 9 a 12 mayor, 13 a 16 anular, 17 a 20 meñique
const DEDOS = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];
const PALMA = [0, 1, 5, 9, 13, 17];

function dibujarSiluetaMano(ctx, puntos) {
  const s = CONFIG.escalaVaho;
  const P = puntos.map(q => ({ x: q.x * s, y: q.y * s }));
  const anchoPalma = Math.hypot(P[5].x - P[17].x, P[5].y - P[17].y);
  const grosor = max(2, anchoPalma * CONFIG.grosorDedos);

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.strokeStyle = '#000';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // La sombra también borra: así el borde de la huella queda difuso
  ctx.shadowColor = '#000';
  ctx.shadowBlur = grosor * CONFIG.bordeHuella;

  // Palma
  ctx.beginPath();
  PALMA.forEach((i, k) => (k ? ctx.lineTo(P[i].x, P[i].y) : ctx.moveTo(P[i].x, P[i].y)));
  ctx.closePath();
  ctx.lineWidth = grosor;
  ctx.fill();
  ctx.stroke();

  // Talón de la mano
  ctx.beginPath();
  ctx.arc(P[0].x, P[0].y, grosor * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Dedos, un poco más finos hacia la punta
  for (const dedo of DEDOS) {
    const base = dedo[0] === 1 ? 1.1 : 1;
    for (let k = 0; k < dedo.length - 1; k++) {
      const a = P[dedo[k]], b = P[dedo[k + 1]];
      ctx.lineWidth = grosor * base * (1 - 0.1 * k);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function vidrioEn(x, y) {
  for (const v of vidrios) {
    if (x >= v.x && x < v.x + v.w && y >= v.y && y < v.y + v.h) return v;
  }
  return null;
}

// Una letra gastada se reemplaza por una letra de la mujer vecina
function mutarLetra(x, y, alcance) {
  const esLetra = /\p{L}/u;
  let elegida = null, linea = null, papel = null, menor = Infinity;
  for (const p of escritos) {
    const q = aLocal(p, x, y);
    if (q.x < -alcance || q.x > p.w + alcance || q.y < -alcance || q.y > p.h + alcance) continue;
    for (const l of p.lineas) {
      if (l.alfa < 0.5) continue;
      for (const g of l.glifos) {
        if (!esLetra.test(g.ch)) continue;
        const d = dist(q.x, q.y, g.x, g.y + g.dy - p.tam * 0.3);
        if (d < menor) { menor = d; elegida = g; linea = l; papel = p; }
      }
    }
  }
  if (!elegida || menor > alcance) return;

  const vecinas = [escritos[papel.i - 1], escritos[papel.i + 1]].filter(Boolean);
  if (!vecinas.length) return;
  const vecina = vecinas[floor(random(vecinas.length))];
  const letras = vecina.lineas.flatMap(l => l.glifos).filter(g => esLetra.test(g.ch));
  if (!letras.length) return;
  elegida.ch = letras[floor(random(letras.length))].ch;
  linea.sucio = true;
}


// ---------------------------------------------------------------------
//  GOTAS
// ---------------------------------------------------------------------
function sumarDesgasteLocal(x, y, cantidad) {
  const k = floor(y / CELDA) * columnasDesgaste + floor(x / CELDA);
  if (k < 0 || k >= mapaDesgaste.length) return;
  mapaDesgaste[k] += cantidad;
  if (mapaDesgaste[k] > CONFIG.umbralGota) {
    mapaDesgaste[k] *= 0.3;
    crearGota(x + random(-12, 12), y);
  }
}

function crearGota(x, y) {
  const v = vidrioEn(x, y);
  if (!v) return;
  gotas.push({ x, y, v, vy: random(25, 55), semilla: random(1000) });
}

function actualizarGotas(dt) {
  for (let k = gotas.length - 1; k >= 0; k--) {
    const g = gotas[k];
    const x0 = g.x, y0 = g.y;
    g.vy = min(g.vy + 12 * dt, 90);
    g.y += g.vy * dt;
    g.x += (noise(g.semilla, g.y * 0.01) - 0.5) * 20 * dt;
    borrarTrazo(x0, y0, g.x, g.y, 5, 0.9);

    // La gota arrastra las letras que encuentra en su camino
    for (const p of escritos) {
      const q = aLocal(p, g.x, g.y);
      if (q.x < 0 || q.x > p.w || q.y < 0 || q.y > p.h) continue;
      for (const l of p.lineas) {
        for (const gl of l.glifos) {
          if (abs(gl.x + p.tam * 0.2 - q.x) < 8 && abs(gl.y + gl.dy - p.tam * 0.3 - q.y) < 12) {
            gl.dy += g.vy * dt * 0.7;
            l.sucio = true;
          }
        }
      }
    }
    if (g.y > g.v.y + g.v.h - 4) gotas.splice(k, 1);
  }
}

function dibujarGotas() {
  noStroke();
  for (const g of gotas) {
    const tibieza = constrain(1 - dist(g.x, g.y, llama.x, llama.y) / (marco.h * 0.6), 0, 1);
    fill(lerp(200, 255, tibieza), lerp(210, 215, tibieza), lerp(225, 160, tibieza), 170);
    ellipse(g.x, g.y, 5, 7);
    fill(255, 250, 235, 200);
    circle(g.x - 1, g.y - 1.5, 1.6);
  }
}


// ---------------------------------------------------------------------
//  ESCRIBEN DESDE ADENTRO
// ---------------------------------------------------------------------
function actualizarFantasma(ahora, dt, hayPresencia) {
  if (hayPresencia) {
    if (fantasma) fantasma.v.sosten = 1;
    return;
  }
  if (ahora - ultimaPresencia < CONFIG.esperaFantasma) return;

  if (!fantasma) {
    if (ahora < proximoFantasma) return;
    fantasma = crearFantasma();
    if (!fantasma) return;
  }

  const f = fantasma;
  f.v.sosten = CONFIG.sostenPorEscritura;

  if (f.indice < f.puntos.length) {
    f.acum += (f.puntos.length / CONFIG.duracionFrase) * dt;
    while (f.acum >= 1 && f.indice < f.puntos.length) {
      const q = f.puntos[f.indice];
      const anterior = f.puntos[max(0, f.indice - 1)];
      const salto = dist(q.x, q.y, anterior.x, anterior.y) > f.paso * 2.5;
      borrarTrazo(salto ? q.x : anterior.x, salto ? q.y : anterior.y, q.x, q.y, f.grosor, 0.95);
      f.indice++;
      f.acum -= 1;
    }
    return;
  }

  if (f.terminada === null) f.terminada = ahora;
  if (ahora - f.terminada > CONFIG.sostenerFrase) {
    f.v.sosten = 1;
    fantasma = null;
    proximoFantasma = ahora + CONFIG.pausaEntreFrases;
  }
}

function crearFantasma() {
  const v = vidrios[floor(random(vidrios.length))];
  const frases = v.mujer.fantasma;
  if (!frases || !frases.length) return null;
  const frase = frases[floor(random(frases.length))];

  const g = createGraphics(ceil(v.w), ceil(v.h));
  g.pixelDensity(1);
  const ctx = g.drawingContext;

  let tam = v.h * 0.16;
  let lineas;
  do {
    ctx.font = `600 ${tam}px ${FUENTE_DEDO}`;
    lineas = partirEnLineas(ctx, frase, v.w * 0.82);
    tam *= 0.92;
  } while (lineas.length * tam * 1.15 > v.h * 0.6 && tam > 14);
  tam /= 0.92;
  ctx.font = `600 ${tam}px ${FUENTE_DEDO}`;

  const altoLinea = tam * 1.15;
  const yInicial = v.h * 0.45 - ((lineas.length - 1) * altoLinea) / 2;

  // Espejado: se escribe desde el otro lado del vidrio
  ctx.save();
  ctx.translate(v.w, 0);
  ctx.scale(-1, 1);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  lineas.forEach((l, k) => ctx.fillText(l, v.w / 2, yInicial + k * altoLinea));
  ctx.restore();

  // Muestreo de las letras en el orden en que avanzaría una mano del otro lado
  g.loadPixels();
  const paso = max(3, floor(tam * 0.07));
  const puntos = [];
  lineas.forEach((_, k) => {
    const yc = yInicial + k * altoLinea;
    const y0 = max(0, floor(yc - tam * 0.75));
    const y1 = min(g.height - 1, ceil(yc + tam * 0.75));
    let haciaAbajo = true;
    for (let x = g.width - 1; x >= 0; x -= paso) {
      const columna = [];
      for (let y = y0; y <= y1; y += paso) {
        if (g.pixels[4 * (x + y * g.width) + 3] > 128) columna.push({ x: v.x + x, y: v.y + y });
      }
      if (!haciaAbajo) columna.reverse();
      if (columna.length) haciaAbajo = !haciaAbajo;
      puntos.push(...columna);
    }
  });
  g.remove();

  if (!puntos.length) return null;
  return { v, puntos, indice: 0, acum: 0, paso, grosor: paso * 0.9, terminada: null };
}

function partirEnLineas(ctx, texto, anchoMax) {
  const palabras = texto.split(/\s+/);
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const prueba = actual ? actual + ' ' + p : p;
    if (ctx.measureText(prueba).width > anchoMax && actual) {
      lineas.push(actual);
      actual = p;
    } else {
      actual = prueba;
    }
  }
  if (actual) lineas.push(actual);
  return lineas;
}


// ---------------------------------------------------------------------
//  CÁMARA: DEDOS, PRESENCIA, REFLEJO
// ---------------------------------------------------------------------
function videoListo() {
  return video && video.elt && video.elt.readyState >= 2 && video.elt.videoWidth > 0;
}

// Mano abierta de referencia para probar con el mouse (unidades relativas a la palma)
const MANO_MODELO = [
  [0, 0],
  [-0.35, -0.15], [-0.65, -0.4], [-0.85, -0.65], [-1.0, -0.85],
  [-0.35, -0.95], [-0.42, -1.4], [-0.46, -1.7], [-0.5, -1.95],
  [-0.05, -1.0], [-0.05, -1.5], [-0.05, -1.82], [-0.05, -2.08],
  [0.22, -0.95], [0.27, -1.4], [0.3, -1.7], [0.33, -1.92],
  [0.45, -0.82], [0.55, -1.15], [0.62, -1.38], [0.68, -1.58],
];

function obtenerManos() {
  const crudas = [];
  if (videoListo()) {
    for (const mano of manos) {
      const k = mano.keypoints;
      if (!k || k.length < 21) continue;
      crudas.push(escalarMano(anticipar(k).map(q => videoAPantalla(q.x, q.y))));
    }
  }
  if (mouseIsPressed && !ratonEnPanel()) {
    const u = CONFIG.tamanoManoMouse;
    crudas.push({
      raton: true,
      ...escalarMano(MANO_MODELO.map(([mx, my]) => ({ x: mouseX + mx * u, y: mouseY + (my + 0.55) * u }))),
    });
  }
  return suavizarManos(crudas);
}

function centroDe(puntos) {
  return { x: (puntos[0].x + puntos[9].x) / 2, y: (puntos[0].y + puntos[9].y) / 2 };
}

function escalarMano(puntos) {
  const c = centroDe(puntos);
  const f = CONFIG.tamanoMano;
  const escalados = puntos.map(q => ({ x: c.x + (q.x - c.x) * f, y: c.y + (q.y - c.y) * f }));
  return { puntos: escalados, centro: c };
}

// La zona útil de la cámara se proyecta sobre la ventana
function videoAPantalla(vx, vy) {
  const z = CONFIG.zonaCamara;
  let nx = 1 - vx / video.elt.videoWidth;
  let ny = vy / video.elt.videoHeight;
  nx = constrain((nx - z.x0) / max(0.01, z.x1 - z.x0), 0, 1);
  ny = constrain((ny - z.y0) / max(0.01, z.y1 - z.y0), 0, 1);
  return { x: marco.x + nx * marco.w, y: marco.y + ny * marco.h };
}

// Asocia cada mano con la del cuadro anterior y suaviza el temblor
function suavizarManos(nuevas) {
  const salida = [];
  const usadas = new Set();
  for (const n of nuevas) {
    let mejor = -1, menor = 220;
    manosPrevias.forEach((p, i) => {
      if (usadas.has(i)) return;
      const d = dist(n.centro.x, n.centro.y, p.centro.x, p.centro.y);
      if (d < menor) { menor = d; mejor = i; }
    });
    if (mejor >= 0) {
      usadas.add(mejor);
      const p = manosPrevias[mejor];
      const a = n.raton ? 1 : CONFIG.suavizadoMano;
      const puntos = n.puntos.map((q, i) => ({ x: lerp(p.puntos[i].x, q.x, a), y: lerp(p.puntos[i].y, q.y, a) }));
      salida.push({ puntos, centro: centroDe(puntos), previo: p });
    } else {
      salida.push({ puntos: n.puntos, centro: n.centro, previo: { puntos: n.puntos, centro: n.centro } });
    }
  }
  manosPrevias = salida.map(m => ({ puntos: m.puntos, centro: m.centro }));
  return salida;
}

function detectarMovimiento(ahora) {
  if (!videoListo()) return;
  chicoCtx.drawImage(video.elt, 0, 0, chico.width, chico.height);
  const px = chicoCtx.getImageData(0, 0, chico.width, chico.height).data;
  if (chicoPrevio) {
    let suma = 0;
    for (let k = 0; k < px.length; k += 4) suma += abs(px[k + 1] - chicoPrevio[k + 1]);
    movimiento = suma / (px.length / 4);
    if (movimiento > CONFIG.umbralMovimiento) ultimaPresencia = ahora;
  }
  chicoPrevio = px;
}

// Reflejo de quien mira: vive solo en el instante, nunca se guarda
function dibujarReflejo() {
  if (CONFIG.opacidadReflejo <= 0 || !videoListo()) return;
  // Se actualiza cada dos cuadros, en un lienzo pequeño
  if (frameCount % 2 === 0) {
    const c = reflejoCtx;
    c.save();
    c.globalCompositeOperation = 'source-over';
    c.translate(reflejo.width, 0);
    c.scale(-1, 1);
    c.drawImage(video.elt, 0, 0, reflejo.width, reflejo.height);
    c.restore();
    c.globalCompositeOperation = 'saturation';   // quita el color
    c.fillStyle = '#808080';
    c.fillRect(0, 0, reflejo.width, reflejo.height);
    c.globalCompositeOperation = 'source-over';
  }
  // Recorte con la proporción de la ventana
  const aspecto = marco.w / marco.h;
  let sw = reflejo.height * aspecto, sh = reflejo.height;
  if (sw > reflejo.width) { sw = reflejo.width; sh = sw / aspecto; }
  const sx = (reflejo.width - sw) / 2, sy = (reflejo.height - sh) / 2;
  const ctx = drawingContext;
  ctx.save();
  ctx.globalAlpha = CONFIG.opacidadReflejo;
  ctx.drawImage(reflejo, sx, sy, sw, sh, marco.x, marco.y, marco.w, marco.h);
  ctx.restore();
}


// ---------------------------------------------------------------------
//  ALIENTO
// ---------------------------------------------------------------------
function actualizarAliento() {
  let rms = 0;
  if (analizador) {
    analizador.getFloatTimeDomainData(datosAudio);
    let suma = 0;
    for (const s of datosAudio) suma += s * s;
    rms = Math.sqrt(suma / datosAudio.length);
  }
  if (simulandoAliento) rms = 0.12;
  nivelCrudo = rms;
  const objetivo = rms > CONFIG.umbralAliento ? (rms - CONFIG.umbralAliento) * 10 : 0;
  nivelAliento = lerp(nivelAliento, objetivo, 0.15);
  if (nivelAliento < 0.01) nivelAliento = 0;
}


// ---------------------------------------------------------------------
//  MARCO DE VIDRIO REPARTIDO
// ---------------------------------------------------------------------
function dibujarMarco() {
  noStroke();
  fill(0);
  rect(0, 0, W, marco.y);
  rect(0, marco.y + marco.h, W, H - marco.y - marco.h);
  rect(0, 0, marco.x, H);
  rect(marco.x + marco.w, 0, W - marco.x - marco.w, H);

  if (!CONFIG.mostrarTravesanos) return;
  const b = CONFIG.anchoTravesano;
  const m = CONFIG.anchoMarco;

  // Madera a contraluz: casi negra, con un filo tibio del lado de la vela
  fill(16, 11, 8);
  for (let c = 1; c < CONFIG.columnas; c++) {
    rect(marco.x + c * (marco.anchoVidrio + b) - b, marco.y, b, marco.h);
  }
  for (let f = 1; f < CONFIG.filas; f++) {
    rect(marco.x, marco.y + f * (marco.altoVidrio + b) - b, marco.w, b);
  }
  rect(marco.x - m, marco.y - m, marco.w + 2 * m, m);
  rect(marco.x - m, marco.y + marco.h, marco.w + 2 * m, m * 1.4);
  rect(marco.x - m, marco.y, m, marco.h);
  rect(marco.x + marco.w, marco.y, m, marco.h);

  const ctx = drawingContext;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const filo = ctx.createRadialGradient(llama.x, llama.y, 0, llama.x, llama.y, marco.h * 0.7);
  filo.addColorStop(0, `rgba(90, 50, 20, ${0.35 * llama.brillo})`);
  filo.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = filo;
  for (let c = 1; c < CONFIG.columnas; c++) {
    ctx.fillRect(marco.x + c * (marco.anchoVidrio + b) - b, marco.y, 2, marco.h);
  }
  for (let f = 1; f < CONFIG.filas; f++) {
    ctx.fillRect(marco.x, marco.y + f * (marco.altoVidrio + b) - b, marco.w, 2);
  }
  ctx.restore();
}


// ---------------------------------------------------------------------
//  CALIBRACIÓN (tecla d)
// ---------------------------------------------------------------------
function dibujarCalibracion(manosEnPantalla, hayPresencia) {
  if (videoListo()) {
    const pw = 240, ph = round(240 * video.elt.videoHeight / video.elt.videoWidth), x0 = W - 20 - pw, y0 = 20;
    push();
    translate(W - 20, y0);
    scale(-1, 1);
    drawingContext.drawImage(video.elt, 0, 0, pw, ph);
    pop();
    const z = CONFIG.zonaCamara;
    noFill();
    stroke(255, 200, 0);
    strokeWeight(1);
    rect(x0 + z.x0 * pw, y0 + z.y0 * ph, (z.x1 - z.x0) * pw, (z.y1 - z.y0) * ph);
    noStroke();
    fill(80, 220, 255);
    const vw = video.elt.videoWidth, vh = video.elt.videoHeight;
    for (const mano of manos) {
      for (const k of mano.keypoints) circle(W - 20 - (k.x / vw) * pw, y0 + (k.y / vh) * ph, 4);
    }
  }

  noFill();
  stroke(255, 120, 80);
  strokeWeight(2);
  for (const m of manosEnPantalla) {
    for (const q of m.puntos) circle(q.x, q.y, 6);
    circle(m.centro.x, m.centro.y, 14);
  }

  noStroke();
  fill(255, 200, 0);
  textFont('monospace');
  textSize(12);
  for (const v of vidrios) text(`${v.segundos.toFixed(1)} s`, v.x + 8, v.y + 16);
  fill(160, 255, 190);
  for (const p of escritos) {
    text(`limpio ${p.claridad.toFixed(2)}  sostenido ${p.sostenido.toFixed(1)} s`, p.cx - p.w / 2, p.cy + p.h / 2 + 14);
  }
  fill(255, 200, 0);

  fill(0, 190);
  rect(10, 10, 640, 302);
  fill(255);
  textSize(13);
  const lineas = [
    `fps ${frameRate().toFixed(0)}`,
    `cámara ${nombreCamaraEnUso} (${videoListo() ? video.elt.videoWidth + 'x' + video.elt.videoHeight : 'sin imagen'})`,
    `imágenes de la cámara: ${fpsRealCamara.toFixed(1)} por segundo (pedidas ${CONFIG.fpsCamara})`,
    `cámaras conectadas: ${camarasEncontradas.join(' | ') || 'ninguna'}`,
    `detección de manos: ${estadoManos}`,
    `manos detectadas ${manos.length}  |  detección ${msDeteccion.toFixed(0)} ms, ${deteccionesPorSegundo.toFixed(1)} por segundo`,
    `movimiento ${movimiento.toFixed(1)} (umbral ${CONFIG.umbralMovimiento})`,
    `presencia ${hayPresencia ? 'sí' : 'no'}`,
    `escritura desde adentro ${fantasma ? (fantasma.v.sosten < 1 ? 'escribiendo' : 'detenida') : 'en espera'}`,
    `micrófono ${analizador ? nivelCrudo.toFixed(3) : 'sin iniciar'} (umbral ${CONFIG.umbralAliento})`,
    `aliento ${nivelAliento.toFixed(2)}`,
    `reinicios: manos ${reiniciosManos}, cámara ${reiniciosCamara}, errores de dibujo ${erroresDeDibujo}`,
    ultimoError ? `último error: ${ultimoError.slice(0, 70)}` : '',
    avisoGrafico,
  ];
  lineas.forEach((l, k) => text(l, 20, 32 + k * 19));

  const bx = 20, by = 294, bw = 310;
  fill(60);
  rect(bx, by, bw, 8);
  fill(nivelCrudo > CONFIG.umbralAliento ? color(80, 220, 255) : color(160));
  rect(bx, by, min(bw, (nivelCrudo / 0.15) * bw), 8);
  fill(255, 200, 0);
  rect(bx + (CONFIG.umbralAliento / 0.15) * bw, by - 3, 2, 14);
}



// ---------------------------------------------------------------------
//  PANEL DE CALIBRACIÓN (tecla d)
//  Cada control cambia CONFIG en vivo. Algunos ajustes necesitan
//  rehacer una parte de la obra; eso se indica en "efecto":
//    luz       recalcula la vela y la habitación
//    segundos  recalcula el ritmo de cada paño
//    rehacer   reconstruye la ventana entera (vuelve a empañarse)
//    escritos  vuelve a escribir los haikus en los vidrios
//    fps       cambia los cuadros por segundo
// ---------------------------------------------------------------------
const AJUSTES = [
  { grupo: 'Vaho', abierto: true, items: [
    { ruta: 'segundosMasAntigua', nombre: 'reempañado paño más antiguo (s)', min: 1, max: 40, paso: 0.5, efecto: 'segundos' },
    { ruta: 'segundosMasReciente', nombre: 'reempañado paño más reciente (s)', min: 5, max: 240, paso: 1, efecto: 'segundos' },
    { ruta: 'factorHumedad', nombre: 'humedad (multiplica el ritmo)', min: 0.1, max: 3, paso: 0.05 },
    { ruta: 'capaReempanado', nombre: 'densidad de cada capa', min: 0.01, max: 0.2, paso: 0.005 },
    { ruta: 'escalaVaho', nombre: 'resolución del vaho', min: 0.15, max: 0.5, paso: 0.05, efecto: 'rehacer' },
  ]},
  { grupo: 'Poemas', abierto: true, items: [
    { ruta: 'segundosLinea2', nombre: 'cuidado para la 2.ª línea (s)', min: 0.5, max: 40, paso: 0.5 },
    { ruta: 'segundosLinea3', nombre: 'cuidado para la 3.ª línea (s)', min: 1, max: 90, paso: 0.5 },
    { ruta: 'claridadParaLeer', nombre: 'cuánto limpiar para que cuente', min: 0.1, max: 0.95, paso: 0.01 },
    { ruta: 'olvidoPoema', nombre: 'rapidez del olvido', min: 0.1, max: 6, paso: 0.1 },
    { ruta: 'tamTexto', nombre: 'tamaño de la letra', min: 0.03, max: 0.16, paso: 0.001, efecto: 'escritos' },
    { ruta: 'dispersionEscritos', nombre: 'dispersión dentro del vidrio', min: 0, max: 1, paso: 0.01, efecto: 'escritos' },
    { ruta: 'inclinacionEscritos', nombre: 'inclinación de los escritos', min: 0, max: 0.4, paso: 0.01, efecto: 'escritos' },
    { ruta: 'goteo', nombre: 'chorreaduras del marcador', min: 0, max: 3, paso: 0.1, efecto: 'escritos' },
  ]},
  { grupo: 'Mano', abierto: true, items: [
    { ruta: 'tamanoMano', nombre: 'tamaño de la huella', min: 0.4, max: 3, paso: 0.05 },
    { ruta: 'grosorDedos', nombre: 'grosor de los dedos', min: 0.15, max: 0.7, paso: 0.01 },
    { ruta: 'bordeHuella', nombre: 'borde difuso', min: 0, max: 2, paso: 0.05 },
    { ruta: 'suavizadoMano', nombre: 'rapidez de seguimiento', min: 0.05, max: 1, paso: 0.05 },
    { ruta: 'anticipacion', nombre: 'anticipación del movimiento (ms)', min: 0, max: 200, paso: 5 },
    { ruta: 'tamanoManoMouse', nombre: 'tamaño de la mano del mouse', min: 20, max: 160, paso: 1 },
  ]},
  { grupo: 'Cámara', items: [
    { ruta: 'zonaCamara.x0', nombre: 'zona útil: borde izquierdo', min: 0, max: 1, paso: 0.01 },
    { ruta: 'zonaCamara.x1', nombre: 'zona útil: borde derecho', min: 0, max: 1, paso: 0.01 },
    { ruta: 'zonaCamara.y0', nombre: 'zona útil: borde superior', min: 0, max: 1, paso: 0.01 },
    { ruta: 'zonaCamara.y1', nombre: 'zona útil: borde inferior', min: 0, max: 1, paso: 0.01 },
    { ruta: 'opacidadReflejo', nombre: 'reflejo de quien mira', min: 0, max: 0.6, paso: 0.01 },
    { ruta: 'umbralMovimiento', nombre: 'umbral de movimiento', min: 1, max: 60, paso: 0.5 },
    { ruta: 'memoriaPresencia', nombre: 'memoria de presencia (s)', min: 0.5, max: 15, paso: 0.5 },
    { ruta: 'intervaloManos', nombre: 'pausa entre detecciones (ms)', min: 0, max: 300, paso: 5 },
  ]},
  { grupo: 'Aliento', items: [
    { ruta: 'umbralAliento', nombre: 'umbral del micrófono', min: 0.002, max: 0.2, paso: 0.001 },
    { ruta: 'gananciaAliento', nombre: 'fuerza del aliento', min: 0, max: 5, paso: 0.1 },
  ]},
  { grupo: 'Vela', items: [
    { ruta: 'vela.x', nombre: 'posición horizontal', min: 0, max: 1, paso: 0.01, efecto: 'luz' },
    { ruta: 'vela.y', nombre: 'posición vertical', min: 0, max: 1, paso: 0.01, efecto: 'luz' },
    { ruta: 'vela.tamLlama', nombre: 'tamaño de la llama', min: 0.01, max: 0.15, paso: 0.005, efecto: 'luz' },
    { ruta: 'vela.intensidad', nombre: 'intensidad de la luz', min: 0, max: 1.5, paso: 0.05, efecto: 'luz' },
    { ruta: 'vela.alcanceLuz', nombre: 'alcance de la luz', min: 0.2, max: 2.5, paso: 0.05, efecto: 'luz' },
    { ruta: 'vela.parpadeo', nombre: 'parpadeo', min: 0, max: 0.8, paso: 0.01 },
    { ruta: 'vela.luzEnVaho', nombre: 'luz de la vela en el vaho', min: 0, max: 2, paso: 0.05 },
  ]},
  { grupo: 'Escritura desde adentro', items: [
    { ruta: 'esperaFantasma', nombre: 'espera sin nadie (s)', min: 1, max: 90, paso: 1 },
    { ruta: 'duracionFrase', nombre: 'duración de cada frase (s)', min: 2, max: 40, paso: 0.5 },
    { ruta: 'sostenerFrase', nombre: 'frase terminada visible (s)', min: 0, max: 30, paso: 0.5 },
    { ruta: 'pausaEntreFrases', nombre: 'pausa entre frases (s)', min: 0, max: 60, paso: 1 },
    { ruta: 'sostenPorEscritura', nombre: 'freno del vaho al escribir', min: 0, max: 1, paso: 0.01 },
  ]},
  { grupo: 'Desgaste y gotas', items: [
    { ruta: 'desgastePorMutacion', nombre: 'limpiado antes de cambiar una letra', min: 200, max: 12000, paso: 100 },
    { ruta: 'umbralGota', nombre: 'insistencia para que caiga una gota', min: 150, max: 6000, paso: 50 },
  ]},
  { grupo: 'Ventana', items: [
    { ruta: 'margen', nombre: 'margen', min: 0, max: 0.2, paso: 0.005, efecto: 'rehacer' },
    { ruta: 'proporcionVentana', nombre: 'proporción (ancho / alto)', min: 0.5, max: 1.6, paso: 0.01, efecto: 'rehacer' },
    { ruta: 'anchoTravesano', nombre: 'grosor de travesaños', min: 0, max: 50, paso: 1, efecto: 'rehacer' },
    { ruta: 'anchoMarco', nombre: 'grosor del marco', min: 0, max: 80, paso: 1, efecto: 'rehacer' },
    { ruta: 'mostrarTravesanos', nombre: 'dibujar travesaños y marco', tipo: 'casilla' },
  ]},
  { grupo: 'Rendimiento', items: [
    { ruta: 'fps', nombre: 'cuadros por segundo', min: 15, max: 60, paso: 1, efecto: 'fps' },
    { ruta: 'resolucionHabitacion', nombre: 'resolución de la habitación', min: 0.25, max: 1, paso: 0.05, efecto: 'luz' },
  ]},
];

const CLAVE_GUARDADO = 'vaho-ajustes';
let panel = null, estadoPanel = null;
let sobrePanel = false, arrastrandoEnPanel = false;
const esperasEfecto = {};

function leerAjuste(ruta, fuente = CONFIG) {
  return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), fuente);
}

function escribirAjuste(ruta, valor) {
  const claves = ruta.split('.');
  let o = CONFIG;
  for (let i = 0; i < claves.length - 1; i++) o = o[claves[i]];
  o[claves[claves.length - 1]] = valor;
}

function todasLasRutas() {
  return AJUSTES.flatMap(g => g.items.map(it => it.ruta));
}

function ratonEnPanel() {
  return depurar && (sobrePanel || arrastrandoEnPanel);
}

function cargarAjustesGuardados() {
  try {
    const texto = localStorage.getItem(CLAVE_GUARDADO);
    if (!texto) return;
    aplicarAjustes(JSON.parse(texto));
  } catch (e) {
    console.warn('No se pudieron leer los ajustes guardados.', e);
  }
}

function aplicarAjustes(datos) {
  for (const ruta of todasLasRutas()) {
    if (datos[ruta] !== undefined) escribirAjuste(ruta, datos[ruta]);
  }
}

function ajustesActuales() {
  const datos = {};
  for (const ruta of todasLasRutas()) datos[ruta] = leerAjuste(ruta);
  return datos;
}

// Aplica lo que cada ajuste necesita. Los pesados esperan a que se suelte el control.
function aplicarEfecto(efecto) {
  if (!efecto) return;
  if (efecto === 'segundos') {
    for (const v of vidrios) v.segundos = segundosPara(v.t);
    return;
  }
  if (efecto === 'fps') {
    frameRate(CONFIG.fps);
    return;
  }
  clearTimeout(esperasEfecto[efecto]);
  esperasEfecto[efecto] = setTimeout(() => {
    if (efecto === 'luz') actualizarLuz();
    if (efecto === 'escritos') crearEscritos();
    if (efecto === 'rehacer') {
      destruirVentana();
      construirVentana();
    }
  }, efecto === 'rehacer' ? 300 : 150);
}

function actualizarLuz() {
  llama.x = marco.x + CONFIG.vela.x * marco.w;
  llama.y = marco.y + CONFIG.vela.y * marco.h;
  for (const v of vidrios) {
    const distancia = dist(v.x + v.w / 2, v.y + v.h / 2, llama.x, llama.y);
    v.cercania = constrain(1 - distancia / (marco.h * CONFIG.vela.alcanceLuz), 0, 1);
  }
  if (habitacionBase) habitacionBase.remove();
  habitacionBase = crearHabitacionBase();
  for (const e of escritos) calcularLuzEscrito(e);
}

function decimalesDe(paso) {
  const t = String(paso);
  return t.includes('.') ? t.split('.')[1].length : 0;
}

function crearPanel() {
  const estilo = document.createElement('style');
  estilo.textContent = `
    #panel-vaho {
      position: fixed; top: 215px; right: 20px; width: 300px; max-height: calc(100vh - 235px);
      overflow-y: auto; z-index: 20; display: none;
      background: rgba(10, 10, 12, 0.88); color: #e8e4dc;
      font: 12px/1.35 -apple-system, system-ui, sans-serif;
      border: 1px solid rgba(255,255,255,0.12); border-radius: 6px; padding: 8px 10px 10px;
    }
    #panel-vaho details { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 4px 0; }
    #panel-vaho summary { cursor: pointer; font-weight: 600; color: #ffc864; padding: 3px 0; }
    #panel-vaho .fila { margin: 7px 0 2px; }
    #panel-vaho .rotulo { display: flex; justify-content: space-between; gap: 8px; opacity: 0.85; }
    #panel-vaho .valor { font-variant-numeric: tabular-nums; color: #9fe3ff; }
    #panel-vaho input[type=range] { width: 100%; margin: 3px 0 0; accent-color: #ffc864; }
    #panel-vaho .casilla { display: flex; align-items: center; gap: 8px; margin: 8px 0 2px; cursor: pointer; }
    #panel-vaho .botones { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 10px; }
    #panel-vaho button {
      font: inherit; color: #111; background: #e8e4dc; border: 0; border-radius: 4px;
      padding: 6px 4px; cursor: pointer;
    }
    #panel-vaho button:hover { background: #ffc864; }
    #panel-vaho .estado { min-height: 16px; margin-top: 6px; color: #9fe3ff; }
    #panel-vaho textarea { width: 100%; height: 90px; margin-top: 6px; font: 11px monospace; display: none; }
  `;
  document.head.appendChild(estilo);

  panel = document.createElement('div');
  panel.id = 'panel-vaho';
  panel.addEventListener('pointerenter', () => { sobrePanel = true; });
  panel.addEventListener('pointerleave', () => { sobrePanel = false; });
  panel.addEventListener('pointerdown', () => { arrastrandoEnPanel = true; });
  window.addEventListener('pointerup', () => { arrastrandoEnPanel = false; });

  for (const grupo of AJUSTES) {
    const bloque = document.createElement('details');
    if (grupo.abierto) bloque.open = true;
    const titulo = document.createElement('summary');
    titulo.textContent = grupo.grupo;
    bloque.appendChild(titulo);
    for (const it of grupo.items) bloque.appendChild(crearControl(it));
    panel.appendChild(bloque);
  }

  const botones = document.createElement('div');
  botones.className = 'botones';
  const acciones = [
    ['Guardar', guardarAjustes],
    ['Copiar ajustes', copiarAjustes],
    ['Empañar todo', () => { empanarTodo(); avisar('Ventana empañada.'); }],
    ['Valores originales', restaurarAjustes],
  ];
  for (const [texto, accion] of acciones) {
    const b = document.createElement('button');
    b.textContent = texto;
    b.addEventListener('click', accion);
    botones.appendChild(b);
  }
  panel.appendChild(botones);

  estadoPanel = document.createElement('div');
  estadoPanel.className = 'estado';
  panel.appendChild(estadoPanel);

  const cajaTexto = document.createElement('textarea');
  cajaTexto.id = 'panel-vaho-texto';
  panel.appendChild(cajaTexto);

  document.body.appendChild(panel);
}

function crearControl(it) {
  if (it.tipo === 'casilla') {
    const fila = document.createElement('label');
    fila.className = 'casilla';
    const caja = document.createElement('input');
    caja.type = 'checkbox';
    caja.checked = !!leerAjuste(it.ruta);
    caja.addEventListener('change', () => {
      escribirAjuste(it.ruta, caja.checked);
      aplicarEfecto(it.efecto);
    });
    fila.appendChild(caja);
    fila.appendChild(document.createTextNode(it.nombre));
    it.refrescar = () => { caja.checked = !!leerAjuste(it.ruta); };
    return fila;
  }

  const fila = document.createElement('div');
  fila.className = 'fila';
  const rotulo = document.createElement('div');
  rotulo.className = 'rotulo';
  const nombre = document.createElement('span');
  nombre.textContent = it.nombre;
  const valor = document.createElement('span');
  valor.className = 'valor';
  rotulo.appendChild(nombre);
  rotulo.appendChild(valor);

  const control = document.createElement('input');
  control.type = 'range';
  control.min = it.min;
  control.max = it.max;
  control.step = it.paso;
  const decimales = decimalesDe(it.paso);
  const mostrar = () => {
    const actual = leerAjuste(it.ruta);
    control.value = actual;
    valor.textContent = Number(actual).toFixed(decimales);
  };
  mostrar();
  control.addEventListener('input', () => {
    escribirAjuste(it.ruta, parseFloat(control.value));
    valor.textContent = parseFloat(control.value).toFixed(decimales);
    aplicarEfecto(it.efecto);
  });
  it.refrescar = mostrar;

  fila.appendChild(rotulo);
  fila.appendChild(control);
  return fila;
}

function refrescarPanel() {
  for (const g of AJUSTES) for (const it of g.items) if (it.refrescar) it.refrescar();
}

function avisar(texto) {
  if (!estadoPanel) return;
  estadoPanel.textContent = texto;
  clearTimeout(avisar.espera);
  avisar.espera = setTimeout(() => { estadoPanel.textContent = ''; }, 4000);
}

function guardarAjustes() {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(ajustesActuales()));
    avisar('Guardado. La próxima vez arranca así.');
  } catch (e) {
    avisar('Este navegador no permitió guardar. Usa "Copiar ajustes".');
  }
}

async function copiarAjustes() {
  const texto = JSON.stringify(ajustesActuales(), null, 2);
  const caja = document.getElementById('panel-vaho-texto');
  try {
    await navigator.clipboard.writeText(texto);
    caja.style.display = 'none';
    avisar('Ajustes copiados al portapapeles.');
  } catch (e) {
    // Si el navegador no deja copiar solo, se muestran para copiarlos a mano
    caja.value = texto;
    caja.style.display = 'block';
    caja.select();
    avisar('Selecciona el texto de abajo y cópialo con Cmd + C.');
  }
}

function restaurarAjustes() {
  aplicarAjustes(Object.fromEntries(todasLasRutas().map(r => [r, leerAjuste(r, CONFIG_ORIGINAL)])));
  try { localStorage.removeItem(CLAVE_GUARDADO); } catch (e) {}
  refrescarPanel();
  frameRate(CONFIG.fps);
  destruirVentana();
  construirVentana();
  avisar('Volvieron los valores originales.');
}


// ---------------------------------------------------------------------
//  TECLADO Y VENTANA
// ---------------------------------------------------------------------
function keyPressed() {
  // Si se está escribiendo en el panel, las teclas no disparan atajos
  const foco = document.activeElement;
  if (foco && (foco.tagName === 'TEXTAREA' || (foco.tagName === 'INPUT' && foco.type === 'number'))) return;
  const k = key.toLowerCase();
  if (k === 'd') {
    depurar = !depurar;
    if (depurar) cursor(ARROW); else noCursor();
    if (panel) panel.style.display = depurar ? 'block' : 'none';
  }
  if (k === 'f') fullscreen(!fullscreen());
  if (k === 'm') CONFIG.mostrarTravesanos = !CONFIG.mostrarTravesanos;
  if (k === 'r') empanarTodo();
  if (k === 'b') simulandoAliento = true;
}

function keyReleased() {
  if (key.toLowerCase() === 'b') simulandoAliento = false;
}

// Al pasar a pantalla completa el navegador avisa varios cambios de tamaño
// seguidos. Se espera a que termine y se rehace la ventana una sola vez.
function windowResized() {
  clearTimeout(esperaTamano);
  esperaTamano = setTimeout(() => {
    if (windowWidth === width && windowHeight === height) return;
    try {
      resizeCanvas(windowWidth, windowHeight);
      destruirVentana();
      construirVentana();
    } catch (e) {
      ultimoError = 'tamaño: ' + (e && e.message ? e.message : e);
      console.error(e);
    }
  }, 350);
}
