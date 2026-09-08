import { IMessageDataWrapper } from '../../../../../api';
import { Triggerable } from './Triggerable';

// WIRED 2.0 variable furni. Reuses the Triggerable wire body and appends the layout code.
export class VariableDefinition extends Triggerable
{
    private _type: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        super(wrapper);

        this._type = wrapper.readInt();
    }

    public get type(): number
    {
        return this._type;
    }

    public get code(): number
    {
        return this._type;
    }
}
