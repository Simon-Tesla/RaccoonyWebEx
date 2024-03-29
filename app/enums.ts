
export enum MessageAction {
    Download = "messageaction_download",
    OpenTabs = "messageaction_opentabs",
    ShowFile = "messageaction_showfile",
    OpenFile = "messageaction_openfile",
    CheckDownload = "messageaction_checkdownload",
    ShowGlobalOptions = "messageaction_showoptions",
    PageContextDownload = "messageaction_page_contextdownload",
    PageContentScriptPresent = "messageaction_page_script_present",
}

export enum MediaType {
    Unknown = "unknown",
    Image = "image",
    Text = "text",
    Flash = "flash",
    Video = "video",
    Audio = "audio",
}

export enum TabLoadOrder {
    Date = "date",
    Page = "page",
}

export enum TabLoadType {
    Placeholder = "Placeholder",
    Timer = "Timer"
}

export enum IconGlyph {
    Download = "\u{25BC}",
    Exists = "\u{2713}",
    OpenFolder = "\u{1f4c2}",
    Fullscreen = "\u{1F50E}",
    ExitFullscreen = "\u{2716}",
    OpenTabs = "\u{29C9}",
    Config = "\u{2699}",
    Close = "\u{2716}",
    Warning = "\u{26A0}"
}

export enum DownloadState {
    NotDownloaded,
    InProgress,
    Done,
    Exists,
    Error,
}

export enum DownloadDestination {
    Default = 0,
    ContextMenuDefault,
    // TODO: add support for custom download destinations
}

export enum PageOverlayIcon {
    Default = "Default",
    Scruff = "Scruff"
}