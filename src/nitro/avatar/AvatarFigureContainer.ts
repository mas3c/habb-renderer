import { IAvatarFigureContainer } from '../../api';

/**
 * Contenedor de la figura de un avatar.
 *
 * Originalmente guardaba las partes en un Map indexado por el tipo de ranura ("hr",
 * "ha", "ch"...), asi que solo cabia UNA prenda por ranura: al meter un segundo gorro
 * pisaba al primero y la figura "ha-1002-70.ha-3175-61" perdia la mitad.
 *
 * Ahora cada parte tiene su propia CLAVE (`tipo:n`) y se guarda ademas que claves
 * pertenecen a cada tipo, lo que permite apilar varias prendas en la misma ranura y
 * respetar el orden en el que se pintan. Quien pregunte por el tipo a secas
 * ("dame el gorro") sigue funcionando: se le devuelve la ultima capa, que es lo que
 * hacia antes.
 */
export class AvatarFigureContainer implements IAvatarFigureContainer
{
    private _parts: Map<string, Map<string, any>>;
    private _partTypeKeys: Map<string, string[]>;
    private _keyCounter: number = 0;

    constructor(figure: string)
    {
        this._parts = new Map();
        this._partTypeKeys = new Map();

        this.parseFigure(figure);
    }

    /**
     * @param setType si se indica, solo las claves de esa ranura; si no, todas en
     *                orden de pintado.
     */
    public getPartTypeIds(setType: string = null): IterableIterator<string>
    {
        if(setType) return this.getPartKeysByType(setType).values();

        return this.partSets().keys();
    }

    /** La ranura ("hr", "ha"...) a la que pertenece una clave. */
    public getPartType(key: string): string
    {
        const existing = this.partSets().get(key);

        if(!existing) return key;

        return existing.get('type');
    }

    public hasPartType(k: string): boolean
    {
        return !!this.resolvePartKey(k);
    }

    public getPartSetId(k: string): number
    {
        const existing = this.getPartData(k);

        if(!existing) return 0;

        return existing.get('setid');
    }

    public getPartColorIds(k: string): number[]
    {
        const existing = this.getPartData(k);

        if(!existing) return null;

        return existing.get('colorids');
    }

    /** Deja una sola prenda en esa ranura. Es el comportamiento de siempre. */
    public updatePart(setType: string, partSetId: number, colorIds: number[]): void
    {
        this.removePart(setType);
        this.addPart(setType, partSetId, colorIds);
    }

    /** Anade una prenda mas a la ranura, encima de las que ya hubiera. */
    public addPart(setType: string, partSetId: number, colorIds: number[]): string
    {
        const set: Map<string, any> = new Map();
        const key = (setType + ':' + (this._keyCounter++));

        set.set('type', setType);
        set.set('setid', partSetId);
        set.set('colorids', colorIds);

        this.partSets().set(key, set);

        const keys = this.getPartKeysByType(setType);

        keys.push(key);
        this.partTypeKeys().set(setType, keys);

        return key;
    }

    /** Acepta una clave concreta (quita esa capa) o un tipo (quita todas las suyas). */
    public removePart(k: string): void
    {
        const existing = this.partSets().get(k);

        if(existing)
        {
            this.removeKey(k, existing.get('type'));

            return;
        }

        for(const key of this.getPartKeysByType(k).slice()) this.removeKey(key, k);
    }

    public getFigureString(): string
    {
        const parts: string[] = [];

        for(const set of this.partSets().values())
        {
            if(!set) continue;

            let setParts = [];

            setParts.push(set.get('type'));
            setParts.push(set.get('setid'));

            setParts = setParts.concat(set.get('colorids'));

            parts.push(setParts.join('-'));
        }

        return parts.join('.');
    }

    private partSets(): Map<string, Map<string, any>>
    {
        if(!this._parts) this._parts = new Map();

        return this._parts;
    }

    private partTypeKeys(): Map<string, string[]>
    {
        if(!this._partTypeKeys) this._partTypeKeys = new Map();

        return this._partTypeKeys;
    }

    private getPartKeysByType(setType: string): string[]
    {
        const keys = this.partTypeKeys().get(setType);

        return keys ? keys : [];
    }

    private removeKey(key: string, setType: string): void
    {
        this.partSets().delete(key);

        const keys = this.getPartKeysByType(setType).filter(existing => (existing !== key));

        if(keys.length) this.partTypeKeys().set(setType, keys);
        else this.partTypeKeys().delete(setType);
    }

    /** Una clave se usa tal cual; un tipo resuelve a su ultima capa. */
    private resolvePartKey(k: string): string
    {
        if(this.partSets().has(k)) return k;

        const keys = this.getPartKeysByType(k);

        if(!keys.length) return null;

        return keys[keys.length - 1];
    }

    private getPartData(k: string): Map<string, any>
    {
        const key = this.resolvePartKey(k);

        if(!key) return null;

        return this.partSets().get(key);
    }

    private parseFigure(figure: string): void
    {
        if(!figure) figure = '';

        for(const part of figure.split('.'))
        {
            const pieces = part.split('-');

            if(pieces.length >= 2)
            {
                const type = pieces[0];
                const setId = parseInt(pieces[1]);
                const colors = [];

                let index = 2;

                while(index < pieces.length)
                {
                    colors.push(parseInt(pieces[index]));

                    index++;
                }

                // addPart, no updatePart: aqui es donde se conservan las capas repetidas.
                this.addPart(type, setId, colors);
            }
        }
    }
}
