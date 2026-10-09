import { BufferImageSource, Sprite, Texture } from 'pixi.js';
import { TextureUtils } from '../../pixi-proxy';

export class GraphicAssetPalette
{
    private _palette: [number, number, number][];
    private _primaryColor: number;
    private _secondaryColor: number;

    constructor(palette: [number, number, number][], primaryColor: number, secondaryColor: number)
    {
        this._palette = palette;

        while(this._palette.length < 256) this._palette.push([0, 0, 0]);

        this._primaryColor = primaryColor;
        this._secondaryColor = secondaryColor;
    }

    public dispose(): void
    {

    }

    public applyPalette(texture: Texture): Texture
    {
        // Pixi 8 devuelve los píxeles sin premultiplicar; se cambian por la paleta y se sube un búfer nuevo
        // (en Pixi 6 se escribía a mano en la textura WebGL de un render texture).
        const pixels = TextureUtils.getPixels(new Sprite(texture));

        for(let i = 0; i < pixels.length; i += 4)
        {
            let paletteColor = this._palette[pixels[i + 1]];

            if(paletteColor === undefined) paletteColor = [0, 0, 0];

            pixels[i] = paletteColor[0];
            pixels[i + 1] = paletteColor[1];
            pixels[i + 2] = paletteColor[2];
        }

        return new Texture({
            source: new BufferImageSource({
                resource: new Uint8Array(pixels),
                width: texture.frame.width,
                height: texture.frame.height
            })
        });
    }

    public get primaryColor(): number
    {
        return this._primaryColor;
    }

    public get secondaryColor(): number
    {
        return this._secondaryColor;
    }
}
