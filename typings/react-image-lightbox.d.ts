declare module 'react-image-lightbox' {
    import * as React from 'react';

    export interface LightboxProps {
        mainSrc: string;
        prevSrc?: string;
        nextSrc?: string;
        mainSrcThumbnail?: string;
        prevSrcThumbnail?: string;
        nextSrcThumbnail?: string;
        onCloseRequest: () => void;
        onMovePrevRequest?: () => void;
        onMoveNextRequest?: () => void;
        onImageLoadError?: (imageSrc: string, srcType: string, errorEvent: any) => void;
        onAfterOpen?: () => void;
        discourageDownloads?: boolean;
        animationDisabled?: boolean;
        animationOnKeyInput?: boolean;
        animationDuration?: number;
        keyRepeatLimit?: number;
        keyRepeatKeyupBonus?: number;
        imageTitle?: JSX.Element;
        imageCaption?: JSX.Element;
        toolbarButtons?: JSX.Element[];
        reactModalStyle?: {
            overlay?: React.CSSProperties,
            content?: React.CSSProperties
        };
        imagePadding?: number;
        clickOutsideToClose?: boolean;
        enableZoom?: boolean;
        wrapperClassName?: string;
        nextLabel?: string;
        prevLabel?: string;
        zoomInLabel?: string;
        zoomOutLabel?: string;
        closeLabel?: string;
    }

    export default class Lightbox extends React.Component<LightboxProps, any> {

    }
}