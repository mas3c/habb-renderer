// Tiempos y recuentos por etapa (activar furnis, subir hojas, planos…) que la telemetría de la beta manda cada minuto y al
// entrar en una sala, para ver en la HK qué etapa pesa en cada equipo. Se acumulan aquí y se vacían al leerlos.
const sumas = new Map<string, number>();

export const Metricas = {
    add: (nombre: string, valor: number = 1) => sumas.set(nombre, ((sumas.get(nombre) || 0) + valor)),
    leer: (): Record<string, number> =>
    {
        const datos: Record<string, number> = {};

        for(const [ nombre, valor ] of sumas) datos[nombre] = (Math.round(valor * 10) / 10);

        sumas.clear();

        return datos;
    }
};
