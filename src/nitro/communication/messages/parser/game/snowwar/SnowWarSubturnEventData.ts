import { IMessageDataWrapper } from '../../../../../../api';

/**
 * Evento de GameStatus del AIR (SnowWarGameEventData): el tipo y sus enteros en orden. Son órdenes (andar, tirar, hacer
 * bola, coger bola…), no resultados: el cliente las aplica en su simulación, que es la misma que la del servidor.
 */
export class SnowWarSubturnEventData
{
    public static HUMAN_LEFT_GAME = 1;
    public static NEW_MOVE_TARGET = 2;
    public static THROW_AT_HUMAN = 3;
    public static THROW_AT_POSITION = 4;
    public static START_MAKING_SNOWBALL = 7;
    public static CREATE_SNOWBALL = 8;
    public static MACHINE_CREATES_SNOWBALL = 11;
    public static HUMAN_GETS_SNOWBALL = 12;
    /** Extra de Polaris (no está en el AIR): ráfaga del cañón. */
    public static RAY_GUN_BURST = 100;

    /** Enteros que lleva cada tipo detrás del tipo. */
    private static FIELDS: Record<number, number> = { 1: 1, 2: 3, 3: 3, 4: 4, 7: 1, 8: 5, 11: 1, 12: 2, 100: 3 };

    private _eventType: number;
    private _fields: number[] = [];

    constructor(wrapper: IMessageDataWrapper)
    {
        this._eventType = wrapper.readInt();

        const count = SnowWarSubturnEventData.FIELDS[this._eventType] ?? 0;

        for(let i = 0; i < count; i++) this._fields.push(wrapper.readInt());
    }

    public get eventType(): number
    {
        return this._eventType;
    }

    public get fields(): number[]
    {
        return this._fields;
    }
}
