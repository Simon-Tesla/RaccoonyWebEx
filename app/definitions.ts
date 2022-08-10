import * as E from './enums';
import { MediaType } from './enums';

export interface MessageRequest<T> {
    action: E.MessageAction;
    data?: T;
}

export interface ContextDownloadRequest extends MessageRequest<ContextDownloadData> {}

export interface ContextDownloadData {
    srcUrl: string,
    mediaType: MediaType,
}


export interface DownloadResponse {
    success: boolean;
}

export function isContextDownloadRequest(o: MessageRequest<any>): o is ContextDownloadRequest {
    return o.action === E.MessageAction.PageContextDownload;
}

export interface Media {
    url: string;
    siteName: string;
    submissionId: string;
    previewUrl?: string;
    author: string;
    filename: string;
    siteFilename?: string;
    extension: string;
    type?: E.MediaType;
    title: string;
    description: string;
    tags: string[];
    sourceUrl?: string;
    downloadDestination?: E.DownloadDestination;
}

export interface PageLink {
    url: string;
    submissionId?: string;
}

export interface PageLinkList {
    siteName?: string;
    list: PageLink[];
    sortable: boolean;
}

export interface SitePlugin {
    readonly siteName: string;
    getMedia(): Promise<Media>;
    getPageLinkList(): Promise<PageLinkList>;
    hasMedia(): Promise<boolean>;
    hasPageLinkList(): Promise<boolean>;
    registerPageChangeHandler(handler: () => void): void;
    getMediaForSrcUrl(srcUrl: string, mediaType: E.MediaType): Promise<Media>;

    //TODO: implement support for these
    // previous
    // next
    // favorite
}

export interface UserActions {
    openPageLinksInTabs(): void;
    downloadMedia(force?: boolean): void;
    showDownloadMedia(): void;
    toggleFullscreen(): void;
    openOptions(): void;
    dismissOptions(): void;
    showGlobalOptions(): void;
}

// TypeScript doesn't allow mixing string indexes with normal properties of different types in a single interface
// See: https://stackoverflow.com/questions/45258216/property-is-not-assignable-to-string-index-in-interface
export type AllSettings = PrimarySettings & PerSiteSettings;

export interface PrimarySettings {
    version: Number;
    extension: ExtensionSettings;
    default_settings: SiteSettings;
}

export interface PerSiteSettings {
    [siteKey: string]: SiteSettings;
}

export interface Settings {
    siteKey?: string;
    defaultSettings: SiteSettings;
    currentSettings: SiteSettings;
}

export interface SiteSettings {
    hotkeysEnabled?: boolean;
    autoFullscreen?: boolean;
    fullscreenScrollGestureEnabled?: boolean;
    writeMetadata?: boolean;
    tabLoadDelay?: number;
    tabLoadSortBy?: E.TabLoadOrder;
    tabLoadSortAsc?: boolean;
    tabLoadType?: E.TabLoadType;
    downloadPath?: string;
    autoDownload?: boolean;
    contextDownloadPath?: string;
}

export interface ExtensionSettings {
    showContextMenu: boolean;
    switchToNewTab?: boolean;
}

export interface AppState {
    hasMedia: boolean;
    hasPageLinks: boolean;
    canFullscreen: boolean;
    downloadState: E.DownloadState;
    showOptions: boolean;
    isFullscreen: boolean;
}