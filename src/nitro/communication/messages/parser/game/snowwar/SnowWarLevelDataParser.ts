import { IMessageDataWrapper, IMessageParser } from '../../../../../../api';
import { SnowWarLevelItemData } from './SnowWarLevelItemData';
import { SnowWarMachineData } from './SnowWarMachineData';
import { SnowWarPlayerData } from './SnowWarPlayerData';

export interface SnowWarAirFuseObject
{
    name: string;
    id: number;
    x: number;
    y: number;
    xDimension: number;
    yDimension: number;
    height: number;
    direction: number;
    altitude: number;
    canStandOn: boolean;
    stuff: string;
}

export interface SnowWarAirLevel
{
    width: number;
    height: number;
    heightMap: string;
    fuseObjects: SnowWarAirFuseObject[];
}

export class SnowWarLevelDataParser implements IMessageParser
{
    private _gameLengthSeconds: number;
    private _mapId: number;
    private _teamCount: number;
    private _players: SnowWarPlayerData[];
    private _heightmap: string;
    private _items: SnowWarLevelItemData[];
    private _machines: SnowWarMachineData[];
    private _canEditRoom: boolean;
    private _arenaName: string;
    private _level: SnowWarAirLevel;

    public flush(): boolean
    {
        this._gameLengthSeconds = 0;
        this._mapId = -1;
        this._teamCount = 0;
        this._players = [];
        this._heightmap = '';
        this._items = [];
        this._machines = [];
        this._canEditRoom = false;
        this._arenaName = '';
        this._level = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._gameLengthSeconds = wrapper.readInt();
        this._mapId = wrapper.readInt();
        this._teamCount = wrapper.readInt();

        let totalPlayers = wrapper.readInt();

        while(totalPlayers > 0)
        {
            this._players.push(new SnowWarPlayerData(wrapper));

            totalPlayers--;
        }

        this._heightmap = wrapper.readString();

        let totalItems = wrapper.readInt();

        while(totalItems > 0)
        {
            this._items.push(new SnowWarLevelItemData(wrapper));

            totalItems--;
        }

        let totalMachines = wrapper.readInt();

        while(totalMachines > 0)
        {
            this._machines.push(new SnowWarMachineData(wrapper));

            totalMachines--;
        }

        // Optional trailing per-recipient flag (server >= snowwar editor).
        if(!wrapper.bytesAvailable) return true;

        this._canEditRoom = wrapper.readBoolean();

        // AIR GameLevelData: el nivel exacto que simulan servidor y cliente
        if(!wrapper.bytesAvailable) return true;

        const width = wrapper.readInt();
        const height = wrapper.readInt();
        const heightMap = wrapper.readString();
        const fuseObjects: SnowWarAirFuseObject[] = [];
        let total = wrapper.readInt();

        while(total-- > 0)
        {
            fuseObjects.push({
                name: wrapper.readString(), id: wrapper.readInt(), x: wrapper.readInt(), y: wrapper.readInt(),
                xDimension: wrapper.readInt(), yDimension: wrapper.readInt(), height: wrapper.readInt(), direction: wrapper.readInt(),
                altitude: wrapper.readInt(), canStandOn: wrapper.readBoolean(), stuff: wrapper.readString()
            });
        }

        this._level = { width, height, heightMap, fuseObjects };

        return true;
    }

    public get gameLengthSeconds(): number
    {
        return this._gameLengthSeconds;
    }

    public get mapId(): number
    {
        return this._mapId;
    }

    public get teamCount(): number
    {
        return this._teamCount;
    }

    public get players(): SnowWarPlayerData[]
    {
        return this._players;
    }

    public get heightmap(): string
    {
        return this._heightmap;
    }

    public get heightmapRows(): string[]
    {
        return this._heightmap.split(String.fromCharCode(13));
    }

    public get items(): SnowWarLevelItemData[]
    {
        return this._items;
    }

    public get machines(): SnowWarMachineData[]
    {
        return this._machines;
    }

    /** El nivel del AIR para la simulación (null con un servidor viejo). */
    public get level(): SnowWarAirLevel
    {
        return this._level;
    }

    public get canEditRoom(): boolean
    {
        return this._canEditRoom;
    }

    public get arenaName(): string
    {
        return this._arenaName;
    }
}
