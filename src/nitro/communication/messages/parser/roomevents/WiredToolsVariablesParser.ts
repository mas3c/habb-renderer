import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

// wired-tools port, Parte 2 — lista (solo lectura) de las variables wired de la sala.
export interface WiredToolsVariable
{
    scope: string;   // 'room' | 'user' | 'furni' | 'global'
    ownerId: number; // id de furni / id de usuario / 0
    name: string;
    value: string;   // el long del servidor como texto
    persistent: boolean;
    updatedAt: number; // segundos unix; 0 si desconocido
}

export class WiredToolsVariablesParser implements IMessageParser
{
    private _variables: WiredToolsVariable[];

    public flush(): boolean
    {
        this._variables = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._variables = [];

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._variables.push({
                scope: wrapper.readString(),
                ownerId: wrapper.readInt(),
                name: wrapper.readString(),
                value: wrapper.readString(),
                persistent: wrapper.readBoolean(),
                updatedAt: wrapper.readInt()
            });
        }

        return true;
    }

    public get variables(): WiredToolsVariable[]
    {
        return this._variables;
    }
}
