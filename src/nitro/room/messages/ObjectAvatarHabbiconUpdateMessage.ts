import { ObjectStateUpdateMessage } from './ObjectStateUpdateMessage';

/** Ha usado un Habbicon (RoomUseHabbicon del AIR): la burbuja sale encima del avatar. */
export class ObjectAvatarHabbiconUpdateMessage extends ObjectStateUpdateMessage
{
    private _habbiconId: number;

    constructor(habbiconId: number)
    {
        super();

        this._habbiconId = habbiconId;
    }

    public get habbiconId(): number
    {
        return this._habbiconId;
    }
}
