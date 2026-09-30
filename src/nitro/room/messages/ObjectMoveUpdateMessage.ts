import { IVector3D } from '../../../api';
import { RoomObjectUpdateMessage } from '../../../room';

export interface IWiredMoveStyle
{
    duration: number;
    curve: number;
    intensity: number;
}

export class ObjectMoveUpdateMessage extends RoomObjectUpdateMessage
{
    private _targetLocation: IVector3D;
    private _isSlide: boolean;
    private _style: IWiredMoveStyle;

    constructor(location: IVector3D, targetLocation: IVector3D, direction: IVector3D, isSlide: boolean = false, style: IWiredMoveStyle = null)
    {
        super(location, direction);

        this._targetLocation = targetLocation;
        this._isSlide = isSlide;
        this._style = style;
    }

    /** Duración y curva de un deslizamiento wired («Tiempo de Animación», «Curva de Movimiento»). */
    public get style(): IWiredMoveStyle
    {
        return this._style;
    }

    public get targetLocation(): IVector3D
    {
        if(!this._targetLocation) return this.location;

        return this._targetLocation;
    }

    public get isSlide(): boolean
    {
        return this._isSlide;
    }
}
