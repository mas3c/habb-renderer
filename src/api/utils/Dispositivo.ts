// Tipo de equipo para repartir el trabajo por fotograma: en móvil se hace menos de golpe (más fotogramas, menos tirones).
const ua = ((typeof navigator !== 'undefined') && navigator.userAgent) || '';

export const Dispositivo = {
    esAndroid: /Android/i.test(ua),
    esMovil: (/Mobi|Android|iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints > 1)))
};
