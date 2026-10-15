import { IMessageDataWrapper } from '../../../../../../api';

/**
 * Objeto de la arena tal como lo manda el AIR (GameObjectsData): su vector de variables entero (tipo, id…) y, en los
 * jugadores, nombre, misión, figura y sexo. Tipos: 1 bola, 2 árbol, 3 montón, 4 máquina, 5 jugador.
 */
export class SnowWarGameObjectData
{
    public static OBJECT_TYPE_SNOWBALL = 1;
    public static OBJECT_TYPE_TREE = 2;
    public static OBJECT_TYPE_PILE = 3;
    public static OBJECT_TYPE_MACHINE = 4;
    public static OBJECT_TYPE_HUMAN = 5;

    /** Variables de cada tipo, contando el tipo y el id. */
    private static VARIABLES: Record<number, number> = { 1: 11, 2: 9, 3: 7, 4: 8, 5: 19 };

    private _variables: number[] = [];
    private _name = '';
    private _mission = '';
    private _figure = '';
    private _gender = '';

    constructor(wrapper: IMessageDataWrapper)
    {
        const type = wrapper.readInt();
        const count = SnowWarGameObjectData.VARIABLES[type] ?? 2;

        this._variables.push(type);

        for(let i = 1; i < count; i++) this._variables.push(wrapper.readInt());

        if(type === SnowWarGameObjectData.OBJECT_TYPE_HUMAN)
        {
            this._name = wrapper.readString();
            this._mission = wrapper.readString();
            this._figure = wrapper.readString();
            this._gender = wrapper.readString();
        }
    }

    public get objectType(): number
    {
        return this._variables[0];
    }

    public get objectId(): number
    {
        return this._variables[1];
    }

    public get variables(): number[]
    {
        return this._variables;
    }

    public get name(): string
    {
        return this._name;
    }

    public get mission(): string
    {
        return this._mission;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }
}
