import { BLEND_MODES } from 'pixi.js';

// Nitro guarda los modos de mezcla con los números de Pixi 6 (datos de furnis, avatares, efectos de la cámara en
// ui-config). Pixi 8 los nombra con texto: se traducen solo al asignarlos a un sprite de Pixi.
export class NitroBlendMode
{
    public static readonly NORMAL: number = 0;
    public static readonly ADD: number = 1;
    public static readonly MULTIPLY: number = 2;
    public static readonly SCREEN: number = 3;
    public static readonly DARKEN: number = 5;
    public static readonly SUBTRACT: number = 28;

    // DARKEN no existía en WebGL con Pixi 6 (caía a normal) y en Pixi 8 tampoco sin los modos avanzados: igual que antes.
    public static toPixi(mode: number): BLEND_MODES
    {
        switch(mode)
        {
            case NitroBlendMode.ADD: return 'add';
            case NitroBlendMode.MULTIPLY: return 'multiply';
            case NitroBlendMode.SCREEN: return 'screen';
            case NitroBlendMode.SUBTRACT: return 'subtract';
            default: return 'normal';
        }
    }

    // Pixi 6 restaba en WebGL de forma nativa; Pixi 8 solo lo trae como modo avanzado (un filtro por sprite).
    // Se añade a su tabla de WebGL con la misma fórmula que usaba Pixi 6.
    public static registerSubtract(gl: WebGLRenderingContext, blendModesMap: Record<string, number[]>): void
    {
        if(!gl || !blendModesMap) return;

        blendModesMap['subtract'] = [ gl.ONE, gl.ONE, gl.ONE, gl.ONE, gl.FUNC_REVERSE_SUBTRACT, gl.FUNC_ADD ];
    }
}
