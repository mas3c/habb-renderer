import { AdvancedMap, IAdvancedMap, IFigureDataPalette, IPalette, IPartColor } from '../../../../api';
import { PartColor } from './PartColor';

export class Palette implements IPalette
{
    private _id: number;
    private _colors: IAdvancedMap<string, IPartColor>;

    constructor(data: IFigureDataPalette)
    {
        if(!data) throw new Error('invalid_data');

        this._id = data.id;
        this._colors = new AdvancedMap();

        this.append(data);
    }

    public append(data: IFigureDataPalette): void
    {
        for(const color of data.colors)
        {
            const newColor = new PartColor(color);

            this._colors.add(color.id.toString(), newColor);
        }
    }

    /**
     * Umbral a partir del cual un id de color deja de ser una entrada de la paleta y pasa
     * a ser un color LITERAL: id = CUSTOM_COLOR_BASE + 0xRRGGBB.
     *
     * Se hace asi para que la figura siga siendo puramente numerica
     * ("ch-255-16777216"): ni el emulador, ni la base de datos, ni el imager, ni el resto
     * del cliente necesitan saber que existe el color libre. Los ids reales de paleta son
     * numeros pequenos, asi que no hay solape posible.
     */
    public static readonly CUSTOM_COLOR_BASE: number = 0x1000000;

    private static _customColors: Map<number, IPartColor> = new Map();

    public static isCustomColor(id: number): boolean
    {
        return (id >= Palette.CUSTOM_COLOR_BASE);
    }

    /** Color libre sintetizado. Se cachean: getColor se llama en cada repintado. */
    public static getCustomColor(id: number): IPartColor
    {
        let color = Palette._customColors.get(id);

        if(color) return color;

        color = {
            id,
            index: -1,
            clubLevel: 0,
            isSelectable: true,
            rgb: (id - Palette.CUSTOM_COLOR_BASE)
        };

        Palette._customColors.set(id, color);

        return color;
    }

    public getColor(id: number): IPartColor
    {
        if((id === undefined) || id < 0) return null;

        if(Palette.isCustomColor(id)) return Palette.getCustomColor(id);

        return (this._colors.getValue(id.toString()) || null);
    }

    public get id(): number
    {
        return this._id;
    }

    public get colors(): IAdvancedMap<string, IPartColor>
    {
        return this._colors;
    }
}
