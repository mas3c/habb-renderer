import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class UserCurrentBadgesParser implements IMessageParser
{
    private _userId: number;
    private _badges: string[];
    private _badgeRarities: Map<string, string>;

    public flush(): boolean
    {
        this._userId = null;
        this._badges = [];
        this._badgeRarities = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();
        this._badgeRarities = new Map();

        let totalBadges = wrapper.readInt();

        while(totalBadges > 0)
        {
            const slotId = wrapper.readInt();
            const badgeCode = wrapper.readString();
            // Campo extra del emulador (rareza, portado de Hekos): detrás del código.
            const badgeRarity = wrapper.readString();

            this._badges.push(badgeCode);
            this._badgeRarities.set(badgeCode, badgeRarity);

            totalBadges--;
        }

        return true;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get badges(): string[]
    {
        return this._badges;
    }

    /** Rareza de la placa; "common" si el servidor no la clasifica. */
    public getBadgeRarity(code: string): string
    {
        return (this._badgeRarities.get(code) || 'common');
    }
}
