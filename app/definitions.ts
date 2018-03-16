import * as E from './enums';

export interface MessageRequest<T> {
    action: E.MessageAction;
    data?: T;
}

export interface DownloadResponse {
    success: boolean;
}

export interface Media {
    url: string;
    siteName: string;
    submissionId?: string;
    previewUrl?: string;
    author?: string;
    filename?: string;
    siteFilename?: string;
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
    dismissOptions(): void;
}

// TypeScript doesn't allow mixing string indexes with normal properties of different types in a single interface
// See: https://stackoverflow.com/questions/45258216/property-is-not-assignable-to-string-index-in-interface
export type AllSettings = PrimarySettings & PerSiteSettings;

interface PrimarySettings {
    version: Number;
    default_settings: SiteSettings;
}

interface PerSiteSettings {
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
    downloadPath?: string;
}

export interface ExtensionSettings {
    firstRunVersion: string;
}

export interface AppState {
    hasMedia: boolean;
    hasPageLinks: boolean;
    canFullscreen: boolean;
    downloadState: E.DownloadState;
    showOptions: boolean;
    isFullscreen: boolean;
}