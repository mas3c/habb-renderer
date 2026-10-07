import { Resource, Texture } from '@pixi/core';
import { IAssetManager, IDisposable, IMessageEvent, NitroConfiguration } from '../../../api';
import { BadgeImageReadyEvent } from '../../../events';
import { NitroContainer, NitroSprite, NitroTexture, TextureUtils } from '../../../pixi-proxy';
import { GroupBadgePartsEvent } from '../../communication';
import { SessionDataManager } from './../SessionDataManager';
import { BadgeInfo } from './BadgeInfo';
import { GroupBadge } from './GroupBadge';
import { GroupBadgePart } from './GroupBadgePart';

export class BadgeImageManager implements IDisposable
{
    public static GROUP_BADGE: string = 'group_badge';
    public static NORMAL_BADGE: string = 'normal_badge';

    private _assets: IAssetManager;
    private _sessionDataManager: SessionDataManager;
    private _messages: IMessageEvent[];

    private _groupBases: Map<number, string[]>;
    private _groupSymbols: Map<number, string[]>;
    private _groupPartColors: Map<number, string>;

    private _requestedBadges: Map<string, boolean>;
    private _groupBadgesQueue: Map<string, boolean>;

    private _readyToGenerateGroupBadges: boolean;

    constructor(assetManager: IAssetManager, sessionDataManager: SessionDataManager)
    {
        this._assets = assetManager;
        this._sessionDataManager = sessionDataManager;

        this._groupBases = new Map();
        this._groupSymbols = new Map();
        this._groupPartColors = new Map();

        this._requestedBadges = new Map();
        this._groupBadgesQueue = new Map();

        this._readyToGenerateGroupBadges = false;
    }

    public init(): void
    {
        if(this._sessionDataManager && this._sessionDataManager.communication)
        {
            this._messages = [
                new GroupBadgePartsEvent(this.onGroupBadgePartsEvent.bind(this))
            ];

            for(const message of this._messages) this._sessionDataManager.communication.registerMessageEvent(message);
        }
    }

    public dispose(): void
    {
        if(this._messages && this._messages.length)
        {
            for(const message of this._messages) this._sessionDataManager.communication.removeMessageEvent(message);

            this._messages = null;
        }

        this._sessionDataManager = null;
    }

    public getBadgeImage(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE, load: boolean = true): Texture<Resource>
    {
        let badge = this.getBadgeTexture(badgeName, type);

        if(!badge && load) badge = this.getBadgePlaceholder();

        return badge;
    }

    public getBadgeInfo(k: string): BadgeInfo
    {
        const badge = this.getBadgeTexture(k);

        return (badge) ? new BadgeInfo(badge, false) : new BadgeInfo(this.getBadgePlaceholder(), true);
    }

    public loadBadgeImage(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE): string
    {
        if(this._assets.getTexture(this.getBadgeUrl(badgeName, type))) return badgeName;

        this.getBadgeTexture(badgeName, type);

        return null;
    }

    private getBadgeTexture(badgeName: string, type: string = BadgeImageManager.NORMAL_BADGE): Texture<Resource>
    {
        const url = this.getBadgeUrl(badgeName, type);

        if(!url || !url.length) return null;

        const existing = this._assets.getTexture(url);

        if(existing) return existing.clone();

        if(type === BadgeImageManager.NORMAL_BADGE)
        {
            if(this._requestedBadges.get(badgeName)) return null;

            this._requestedBadges.set(badgeName, true);

            this._assets
                .downloadAsset(url)
                .then(status =>
                {
                    if(!status) return;

                    this._requestedBadges.delete(badgeName);

                    const texture = this._assets.getTexture(url);

                    if(texture && this._sessionDataManager) this._sessionDataManager.events.dispatchEvent(new BadgeImageReadyEvent(badgeName, texture.clone()));
                })
                .catch(err =>
                {

                });
        }

        else if(type === BadgeImageManager.GROUP_BADGE)
        {
            if(this._groupBadgesQueue.get(badgeName)) return;

            this._groupBadgesQueue.set(badgeName, true);

            if(this._readyToGenerateGroupBadges) this.loadGroupBadge(badgeName);
        }

        return null;
    }

    private getBadgePlaceholder(): Texture<Resource>
    {
        const url = (NitroConfiguration.getValue<string>('images.url') + '/loading_icon.png');
        const existing = this._assets.getTexture(url);

        if(!existing) return null;

        return existing.clone();
    }

    public getBadgeUrl(badge: string, type: string = BadgeImageManager.NORMAL_BADGE): string
    {
        let url = null;

        switch(type)
        {
            case BadgeImageManager.NORMAL_BADGE:
                url = (NitroConfiguration.getValue<string>('badge.asset.url')).replace('%badgename%', badge);
                break;
            case BadgeImageManager.GROUP_BADGE:
                url = badge;
                break;
        }

        return url;
    }

    private loadGroupBadge(badgeCode: string): void
    {
        const groupBadge = new GroupBadge(badgeCode);
        const partMatches = [...badgeCode.matchAll(/[bst][0-9]{4,6}/g)];

        for(const partMatch of partMatches)
        {
            // Cada pieza: tipo + id + color(2) [+ posición(1)]. El id lleva 2 cifras salvo en 7 caracteres
            // (símbolo de 3 cifras). El emulador guarda la base sin posición («b1106» = base 11, color 06):
            // antes 5 caracteres se leían como id de 3 cifras (base 110, que no existe) y la placa salía sin fondo.
            const partCode = partMatch[0];
            const idLen = (partCode.length === 7) ? 3 : 2;
            const partType = (partCode[0] === 't') ? 's' : partCode[0];
            const partId = parseInt(partCode.slice(1, 1 + idLen)) + ((partCode[0] === 't') ? 100 : 0);
            const partColor = parseInt(partCode.slice(1 + idLen, 3 + idLen));
            const partPosition = (partCode.length > 3 + idLen) ? parseInt(partCode.slice(3 + idLen, 4 + idLen)) : 0;
            const part = new GroupBadgePart(partType, partId, partColor, partPosition);

            groupBadge.parts.push(part);
        }

        this.renderGroupBadge(groupBadge);
    }

    private renderGroupBadge(groupBadge: GroupBadge): void
    {
        const container = new NitroContainer();
        const tempSprite = new NitroSprite(NitroTexture.EMPTY);

        tempSprite.width = GroupBadgePart.IMAGE_WIDTH;
        tempSprite.height = GroupBadgePart.IMAGE_HEIGHT;

        container.addChild(tempSprite);

        for(const part of groupBadge.parts)
        {
            let isFirst = true;

            const partNames = ((part.type === 'b') ? this._groupBases.get(part.key) : this._groupSymbols.get(part.key));

            if(partNames)
            {
                for(const partName of partNames)
                {
                    if(!partName || !partName.length) continue;

                    const texture = this._assets.getTexture(`badgepart_${partName}`);

                    if(!texture) continue;

                    const { x, y } = part.calculatePosition(texture);
                    const sprite = new NitroSprite(texture);

                    sprite.position.set(x, y);

                    if(isFirst) sprite.tint = parseInt(this._groupPartColors.get(part.color), 16);

                    isFirst = false;

                    container.addChild(sprite);
                }
            }
        }

        this._requestedBadges.delete(groupBadge.code);
        this._groupBadgesQueue.delete(groupBadge.code);

        const texture = TextureUtils.generateTexture(container);
        this._assets.setTexture(groupBadge.code, texture);

        if(this._sessionDataManager) this._sessionDataManager.events.dispatchEvent(new BadgeImageReadyEvent(groupBadge.code, texture));
    }

    private onGroupBadgePartsEvent(event: GroupBadgePartsEvent): void
    {
        if(!event) return;

        const data = event.getParser();

        if(!data) return;

        data.bases.forEach((names, id) => this._groupBases.set(id, names.map(val => val.replace('.png', '').replace('.gif', ''))));

        data.symbols.forEach((names, id) => this._groupSymbols.set(id, names.map(val => val.replace('.png', '').replace('.gif', ''))));

        this._groupPartColors = data.partColors;
        this._readyToGenerateGroupBadges = true;

        for(const badgeCode of this._groupBadgesQueue.keys()) this.loadGroupBadge(badgeCode);
    }

    public get disposed(): boolean
    {
        return !!this._sessionDataManager;
    }
}
