import { IMessageDataWrapper, IMessageParser } from '../../../../../api';

/** El Splash de un avatar que entra o sale de la sala: índice + fase ('entry' | 'exit') + spec (SplashMotor). */
export class RoomSplashMessageParser implements IMessageParser
{
    private _roomIndex: number;
    private _fase: string;
    private _splash: string;

    public flush(): boolean
    {
        this._roomIndex = 0;
        this._fase = '';
        this._splash = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._roomIndex = wrapper.readInt();
        this._fase = wrapper.readString();
        this._splash = wrapper.readString();

        return true;
    }

    public get roomIndex(): number { return this._roomIndex; }
    public get fase(): string { return this._fase; }
    public get splash(): string { return this._splash; }
}
