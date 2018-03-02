
export enum MessageAction {
    Download = "messageaction_download",
    OpenTabs = "messageaction_opentabs",
    ShowFile = "messageaction_showfile",
    OpenFile = "messageaction_openfile",
    CheckDownlod = "messageaction_checkdownload",
}

export enum MediaType {
    Unknown = 0,
    Image,
    Text,
    Flash,
    Video,
    Audio,
}

export enum TabLoadOrder {
    Date = "date",
    Page = "page",
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
