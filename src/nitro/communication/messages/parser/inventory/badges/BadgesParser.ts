import { AdvancedMap, IAdvancedMap, IMessageDataWrapper, IMessageParser } from '../../../../../../api';

export class BadgesParser implements IMessageParser
{
    private _allBadgeCodes: string[];
    private _activeBadgeCodes: string[];
    private _badgeIds: IAdvancedMap<string, number>;
    private _badgeRarities: IAdvancedMap<string, string>;

    public flush(): boolean
    {
        this._allBadgeCodes = [];
        this._activeBadgeCodes = null;
        this._badgeIds = null;
        this._badgeRarities = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._allBadgeCodes = [];
        this._activeBadgeCodes = [];
        this._badgeIds = new AdvancedMap();
        this._badgeRarities = new AdvancedMap();

        let count = wrapper.readInt();

        while(count > 0)
        {
            const badgeId = wrapper.readInt();
            const badgeCode = wrapper.readString();
            // Campo extra del emulador (feature de rareza portada de Hekos): viaja
            // siempre detrás del código de la placa.
            const badgeRarity = wrapper.readString();

            this._badgeIds.add(badgeCode, badgeId);
            this._badgeRarities.add(badgeCode, badgeRarity);

            this._allBadgeCodes.push(badgeCode);

            count--;
        }

        count = wrapper.readInt();

        while(count > 0)
        {
            const badgeSlot = wrapper.readInt();
            const badgeCode = wrapper.readString();

            this._activeBadgeCodes.push(badgeCode);

            count--;
        }

        return true;
    }

    public getBadgeId(code: string): number
    {
        return this._badgeIds.getValue(code);
    }

    /** Rareza de la placa; "common" si el servidor no la clasifica. */
    public getBadgeRarity(code: string): string
    {
        return (this._badgeRarities.getValue(code) || 'common');
    }
    public getAllBadgeCodes(): string[]
    {
        return this._allBadgeCodes;
    }

    public getActiveBadgeCodes(): string[]
    {
        return this._activeBadgeCodes;
    }
}
