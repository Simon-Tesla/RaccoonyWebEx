import * as E from './enums';

export interface MessageRequest {
    action: E.MessageAction;
}

export interface Media {
    url: string;
    service: string;
    submissionId?: string;
    previewUrl?: string;
    author?: string;
    filename?: string;
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
    getMedia: () => Media | Promise<Media>;
    getMediaList?: () => MediaList | Promise<MediaList>;
    hasMedia?: () => boolean | Promise<boolean>;
    hasMediaList?: () => boolean | Promise<boolean>;
    // defaultSettings
    // reinitOnMutation -- probably better to just re-query the DOM when saving/open in tabs
    // downloadThisImage -- TODO: plugin API for handling tumblr/twitter, would pass dom element from context menu
    // previous
    // next
    // favorite
}