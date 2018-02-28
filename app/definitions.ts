import * as E from './enums';

export interface MessageRequest<T> {
    action: E.MessageAction;
    data?: T;
}

export interface DownloadResponse {
    message: string;
    isError?: boolean;
}

export interface Media {
    url: string;
    service: string;
    submissionId?: string;
    previewUrl?: string;
    author?: string;
    filename?: string;
    serviceFilename?: string;
    extension?: string;
    type?: E.MediaType;
    title?: string;
    description?: string;
    tags?: string[];
    sourceUrl?: string;
}

export interface PageLink {
    url: string;
    submissionId?: string;
}

export interface PageLinkList {
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

    //TODO: implement support for these
    // downloadThisImage -- TODO: plugin API for handling tumblr/twitter, would pass dom element from context menu
    // previous
    // next
    // favorite
}

export interface UserActions {
    openPageLinksInTabs(): void;
    downloadMedia(): void;
    showDownloadMedia(): void;
    toggleFullscreen(): void;
    openOptions(): void;
}

export interface SiteSettings {
    hotkeysEnabled?: boolean;
    autoFullscreen?: boolean;
    fullscreenScrollGestureEnabled?: boolean;
    writeMetadata?: boolean;
    tabLoadDelay?: number;
    tabLoadSortBy?: E.TabLoadOrder;
    tabLoadSortAsc?: boolean;
    downloadPath?: string;
}

export interface ExtensionSettings {
    firstRunVersion: string;
}