import * as E from './enums';

export interface MessageRequest<T> {
    action: E.MessageAction;
    data?: T;
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
}

export interface MediaList {
    list: Media[];
    sortable: boolean;
}

export interface SitePlugin {
    getMedia(): Promise<Media>;
    getMediaList(): Promise<MediaList>;
    hasMedia(): Promise<boolean>;
    hasMediaList(): Promise<boolean>;
    // defaultSettings
    // reinitOnMutation -- probably better to just re-query the DOM when saving/open in tabs
    // downloadThisImage -- TODO: plugin API for handling tumblr/twitter, would pass dom element from context menu
    // previous
    // next
    // favorite
}