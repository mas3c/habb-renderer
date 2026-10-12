import { AvatarImageBodyPartContainer } from '../AvatarImageBodyPartContainer';
import { AvatarImagePartContainer } from '../AvatarImagePartContainer';

export class AvatarImageDirectionCache
{
    private _partList: AvatarImagePartContainer[];
    private _images: Map<string, AvatarImageBodyPartContainer>;
    // La clave de un fotograma se repite cada mcm(fotogramas de cada parte): se
    // construye una vez por hueco en vez de concatenar todas las partes en cada
    // llamada. Con un periodo mayor que MAX_PERIOD se sigue construyendo al vuelo.
    private _period: number;
    private _keys: string[];

    private static MAX_PERIOD = 240;

    constructor(k: AvatarImagePartContainer[])
    {
        this._partList = k;
        this._images = new Map();

        const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

        let period = 1;

        for(const part of k)
        {
            const n = part.frameCount || 1;

            period = (period / gcd(period, n)) * n;

            if(period > AvatarImageDirectionCache.MAX_PERIOD) break;
        }

        this._period = period;
        this._keys = (period <= AvatarImageDirectionCache.MAX_PERIOD) ? new Array(period) : null;
    }

    public dispose(): void
    {
        for(const image of this._images.values()) image && image.dispose();

        this._images = null;
    }

    public getPartList(): AvatarImagePartContainer[]
    {
        return this._partList;
    }

    public getImageContainer(k: number): AvatarImageBodyPartContainer
    {
        const existing = this._images.get(this.getCacheKey(k));

        if(!existing) return null;

        return existing;
    }

    public updateImageContainer(k: AvatarImageBodyPartContainer, _arg_2: number): void
    {
        const name = this.getCacheKey(_arg_2);

        const existing = this._images.get(name);

        if(existing) existing.dispose();

        this._images.set(name, k);
    }

    private getCacheKey(k: number): string
    {
        if(this._keys)
        {
            const slot = k % this._period;

            return (this._keys[slot] ??= this.buildCacheKey(slot));
        }

        return this.buildCacheKey(k);
    }

    private buildCacheKey(k: number): string
    {
        let name = '';

        for(const part of this._partList) name += (part.getCacheableKey(k) + '/');

        return name;
    }

    private debugInfo(k: string): void
    {
    }
}
