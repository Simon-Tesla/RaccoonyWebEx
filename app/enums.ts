
export enum MessageAction {
    Test = "messageaction_test",
    Download = "messageaction_download",
    OpenTabs = "messageaction_opentabs",
    ShowFile = "messageaction_showfile",
    OpenFile = "messageaction_openfile",
    CheckDownlod = "messageaction_checkdownload",
}

export enum MediaType {
    Unknown = -1,
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