import { Matrix, Texture } from 'pixi.js';
import { IGraphicAsset, RoomObjectVariable } from '../../../../../api';
import { NitroSprite, NitroTexture, TextureUtils } from '../../../../../pixi-proxy';
import { FurnitureDynamicThumbnailVisualization } from './FurnitureDynamicThumbnailVisualization';

export class FurnitureYoutubeVisualization extends FurnitureDynamicThumbnailVisualization
{
    protected static THUMBNAIL_URL: string = 'THUMBNAIL_URL';

    protected getThumbnailURL(): string
    {
        if(!this.object) return null;

        const furnitureData = this.object.model.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);

        if(furnitureData) return (furnitureData[FurnitureYoutubeVisualization.THUMBNAIL_URL] || null);

        return null;
    }

    /**
     * habb.tv: los televisores de frente (dirección 0 o 6, como yttv3) llevan la pantalla
     * plana; la base los inclinaba como a los de lado y la miniatura se salía del marco.
     */
    protected generateTransformedThumbnail(texture: Texture, asset: IGraphicAsset): Texture
    {
        if((this.direction !== 0) && (this.direction !== 6)) return super.generateTransformedThumbnail(texture, asset);

        // El mismo marco negro de 20 px que pone la base, y luego plano a la medida de la pieza.
        const contenedor = new NitroSprite();
        const fondo = new NitroSprite(NitroTexture.WHITE);

        fondo.tint = 0x000000;
        fondo.width = (texture.width + 40);
        fondo.height = (texture.height + 40);

        const imagen = new NitroSprite(texture);

        imagen.position.set(20, 20);
        contenedor.addChild(fondo, imagen);

        const conMarco = TextureUtils.generateTexture(contenedor);
        const matrix = new Matrix();

        matrix.a = (asset.width / conMarco.width);
        matrix.d = (asset.height / conMarco.height);

        const sprite = new NitroSprite(conMarco);

        sprite.setFromMatrix(matrix);

        return TextureUtils.generateTexture(sprite);
    }
}
