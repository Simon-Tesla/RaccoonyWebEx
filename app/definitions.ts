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
    // defaultSettings
    // reinitOnMutation -- probably better to just re-query the DOM when saving/open in tabs
    // downloadThisImage -- TODO: plugin API for handling tumblr/twitter, would pass dom element from context menu
    // previous
    // next
    // favorite
}