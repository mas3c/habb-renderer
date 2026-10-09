import { defaultFilterVert, Filter, GlProgram, Texture, TextureSource, UniformGroup } from 'pixi.js';

// Tipos de Pixi 8 para cada tipo de GLSL de los uniforms
const TIPOS: Record<string, string> = {
    float: 'f32',
    int: 'i32',
    bool: 'i32',
    vec2: 'vec2<f32>',
    vec3: 'vec3<f32>',
    vec4: 'vec4<f32>',
    mat2: 'mat2x2<f32>',
    mat3: 'mat3x3<f32>',
    mat4: 'mat4x4<f32>'
};

const VACIOS: Record<string, () => unknown> = {
    'f32': () => 0,
    'i32': () => 0,
    'vec2<f32>': () => new Float32Array(2),
    'vec3<f32>': () => new Float32Array(3),
    'vec4<f32>': () => new Float32Array(4),
    'mat2x2<f32>': () => new Float32Array(4),
    'mat3x3<f32>': () => new Float32Array(9),
    'mat4x4<f32>': () => new Float32Array(16)
};

/**
 * Filtro con shaders al estilo de Pixi 6 (GLSL 1: varying, texture2D, gl_FragColor, uSampler) sobre Pixi 8.
 *
 * Pixi 8 compila como GLSL 1 todo fragmento sin «#version 300 es», pero su vértice usa otros atributos y su textura
 * se llama uTexture. Aquí se usa su vértice, se renombra uSampler, los uniforms se tipan leyendo las declaraciones del
 * propio shader, y `filter.uniforms.x = valor` funciona como en Pixi 6 (los sampler2D van como recursos).
 * El vértice que se pase se ignora: los de Nitro eran el estándar de Pixi 6.
 */
export class NitroFilter extends Filter
{
    // con WebGPU (opcional, Ajustes › Avanzados) estos shaders no tienen versión WGSL: el filtro se apaga
    public static webgpu = false;

    private _grupo: UniformGroup;
    private _samplers: Set<string>;
    private _uniformsProxy: Record<string, any>;

    constructor(vertex?: string, fragment?: string, uniforms?: Record<string, any>)
    {
        const codigo = (fragment || '').replace(/\buSampler\b/g, 'uTexture');
        const declarados: Record<string, { value: unknown, type: string }> = {};
        const samplers = new Set<string>();
        const recursos: Record<string, any> = {};

        for(const [ , tipo, nombre ] of codigo.matchAll(/uniform\s+(?:(?:lowp|mediump|highp)\s+)?(\w+)\s+(\w+)\s*;/g))
        {
            if(nombre === 'uTexture') continue;

            if(tipo === 'sampler2D')
            {
                samplers.add(nombre);
                recursos[nombre] = Texture.EMPTY.source;

                continue;
            }

            const t = TIPOS[tipo];

            if(t) declarados[nombre] = { value: VACIOS[t](), type: t };
        }

        const grupo = new UniformGroup(declarados as any);

        super({
            glProgram: GlProgram.from({ vertex: defaultFilterVert, fragment: codigo, name: 'nitro-filter' }),
            resources: { ...recursos, nitroUniforms: grupo }
        });

        this._grupo = grupo;
        this._samplers = samplers;

        if(NitroFilter.webgpu) this.enabled = false;

        const filtro = this;

        this._uniformsProxy = new Proxy({}, {
            get: (_, nombre: string) => (samplers.has(nombre) ? filtro.resources[nombre] : grupo.uniforms[nombre]),
            set: (_, nombre: string, valor: any) =>
            {
                if(samplers.has(nombre))
                {
                    filtro.resources[nombre] = (valor instanceof Texture) ? valor.source : (valor as TextureSource);
                }
                else if(nombre in grupo.uniforms)
                {
                    grupo.uniforms[nombre] = valor;
                }

                return true;
            }
        });

        if(uniforms) for(const nombre in uniforms) this._uniformsProxy[nombre] = uniforms[nombre];
    }

    public get uniforms(): Record<string, any>
    {
        return this._uniformsProxy;
    }
}
