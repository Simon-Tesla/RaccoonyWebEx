import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import debounce from 'debounce';
import * as logger from '../../logger';
import { initializeHotkeys } from './hotkeys';
import ActionButton, { ActionButtonProps } from './actionButton';
import SettingsUi from './settings';
import { defaultSiteSettings } from '../../plugins/base';
import { n } from './common'

const IconGlyph = E.IconGlyph;

enum DownloadState {
    NotDownloaded,
    InProgress,
    Done,
    Exists,
    Error,
}

interface PageOverlayProps {
    sitePlugin: I.SitePlugin;
    siteSettings: I.SiteSettings;
    onClickFullscreen: () => void;
    inFullscreen: boolean;
    onChangeSettings: (settings: I.SiteSettings, defaultSettings: I.SiteSettings) => void;
}

// TODO: move most of this state out to Page, and make Page listen to events from background.js, etc.
interface PageOverlayState {
    hasMedia: boolean;
    hasPageLinks: boolean;
    canFullscreen: boolean;
    downloadState: DownloadState;
    downloadMessage?: string;
    showBalloon: boolean;
    showOptions: boolean;
    showUi: boolean;
}

interface DownloadButtonProps extends ActionButtonProps {
    label: string,
}

function sendMessage<T>(action: E.MessageAction, data: T) {
    let message: I.MessageRequest<T> = {
        action,
        data,
    }
    logger.log("sending message", message);
    return browser.runtime.sendMessage(message);
}

const downloadButtonDefaultProps: { [state: number]: DownloadButtonProps } = {};
downloadButtonDefaultProps[DownloadState.Done] = downloadButtonDefaultProps[DownloadState.Exists] = {
    icon: IconGlyph.Exists,
    label: "Downloaded",
    disabled: true,
}
downloadButtonDefaultProps[DownloadState.Error] = {
    icon: IconGlyph.Download,
    label: "Download error",
}
downloadButtonDefaultProps[DownloadState.InProgress] = {
    icon: IconGlyph.Download,
    label: "Downloading",
    disabled: true,
}
downloadButtonDefaultProps[DownloadState.NotDownloaded] = {
    icon: IconGlyph.Download,
    label: "Download",
}

// TODO: Make Page (or some other class) implement PageActions and pass that in as a prop.
export default class PageOverlay extends React.Component<PageOverlayProps, PageOverlayState> implements I.PageActions {
    private _mouseLeaveTimeout: number;
    private _hotkeysDisposer: () => void;

    constructor(props: PageOverlayProps, context) {
        super(props, context);
        this.state = {
            hasMedia: false,
            hasPageLinks: false,
            downloadState: DownloadState.NotDownloaded,
            showBalloon: false,
            showUi: true,
            showOptions: false,
            canFullscreen: false,
        }
        this.props.sitePlugin.registerPageChangeHandler(debounce(this.handlePageChange, 200));
        this.initialize();
    }

    initialize() {
        logger.log("initializing pageOverlay UI");
        this.props.sitePlugin.hasMedia().then((hasMedia) => {
            logger.log("hasMedia", hasMedia);
            this.setState({
                hasMedia,
            });
            if (hasMedia) {
                // Check to see if the file has been downloaded
                this.props.sitePlugin.getMedia().then((media) => {
                    if (media && media.type === E.MediaType.Image) {
                        this.setState({ canFullscreen: true });
                    }
                    sendMessage(E.MessageAction.CheckDownlod, media).then((isDownloaded: boolean) => {
                        if (isDownloaded) {
                            this.setState({ downloadState: DownloadState.Exists });
                        }
                    });
                });
            }
        })

        this.props.sitePlugin.hasPageLinkList().then((hasPageLinks) => {
            logger.log("hasPageLinks", hasPageLinks);
            this.setState({
                hasPageLinks,
            });
        });
    }

    openPageLinksInTabs() {
        this.props.sitePlugin.getPageLinkList().then((list) => {
            sendMessage(E.MessageAction.OpenTabs, list);
        });
    }

    downloadMedia() {
        this.setState({ downloadState: DownloadState.InProgress });
        this.props.sitePlugin.getMedia().then((media) => {
            sendMessage(E.MessageAction.Download, media).then((download: I.DownloadResponse) => {
                // TODO: the download promise resolves when the download starts, not when it finishes.
                this.setState({
                    downloadState: download.isError ? DownloadState.Error : DownloadState.Done,
                    downloadMessage: download.message,
                })
                setTimeout(() => this.setState({
                    downloadState: download.isError ? DownloadState.NotDownloaded : DownloadState.Exists,
                    downloadMessage: '',
                }), 5000);
            })
        });
    }

    showDownloadMedia() {
        // TODO: cache the download ID for already downloaded files?
        this.props.sitePlugin.getMedia().then((media) => {
            sendMessage(E.MessageAction.ShowFile, media);
        });
    }

    toggleFullscreen() {
        this.props.onClickFullscreen();
    }

    openOptions() {
        this.setState({ showOptions: true });
    }

    componentDidMount() {
        if (this.props.siteSettings.hotkeysEnabled) {
            this.enableHotkeys();
        }
    }

    componentDidUpdate(prevProps: PageOverlayProps, prevState: PageOverlayState) {
        if (prevProps.siteSettings) {
            if (prevProps.siteSettings.hotkeysEnabled !== this.props.siteSettings.hotkeysEnabled) {
                if (this.props.siteSettings.hotkeysEnabled) {
                    this.enableHotkeys();
                }
                else {
                    this.disableHotkeys();
                }
            }
        }
    }

    componentWillUnmount() {
        this.disableHotkeys();
    }

    private handlePageChange = () => {
        this.initialize();
    }

    private enableHotkeys() {
        if (!this._hotkeysDisposer) {
            this._hotkeysDisposer = initializeHotkeys(this);
        }
    }

    private disableHotkeys() {
        this._hotkeysDisposer && this._hotkeysDisposer();
    }

    private onClickOpenTabs = () => {
        this.openPageLinksInTabs();
    }

    private onClickDownload = () => {
        this.downloadMedia();
    }

    private onClickOpenFolder = () => {
        this.showDownloadMedia();
    }

    private onClickFullscreen = () => {
        this.toggleFullscreen();
    }

    private onClickOptions = () => {
        this.openOptions();
    }

    private onDismissOptions = () => {
        this.setState({ showOptions: false });
    }

    private onSaveOptions = (settings: I.SiteSettings, defaultSettings: I.SiteSettings) => {
        this.onDismissOptions();
        this.props.onChangeSettings(settings, defaultSettings);
    }

    private onMouseOver = () => {
        if (this._mouseLeaveTimeout) {
            clearTimeout(this._mouseLeaveTimeout);
        }
        this.setState({ showBalloon: true });
    }

    private onMouseOut = () => {
        this._mouseLeaveTimeout = window.setTimeout(() => {
            this.setState({ showBalloon: false });
        }, 1000)
    }

    private onClickClose = () => {
        this.setState({ showUi: false })
    }

    render() {
        let logoUrl = browser.extension.getURL('icon-64.png');
        let showUi = this.state.showUi && (this.state.hasMedia || this.state.hasPageLinks);
        let canDownload = this.state.downloadState === DownloadState.NotDownloaded;
        let showDownloadStatus = this.state.downloadState === DownloadState.InProgress ||
            this.state.downloadState === DownloadState.Done ||
            this.state.downloadState === DownloadState.Error;
        let showBalloon = this.state.showBalloon || showDownloadStatus;

        let mainClassNames = classnames(!showUi ? n('hide') : null, showDownloadStatus ? n('active') : null)

        let alternateBalloonUi: JSX.Element = null;

        // TODO: move the options into a modal dialog
        if (this.state.showOptions) {
            showBalloon = true;
            alternateBalloonUi = (
                <SettingsUi
                    settingsProvider={() => this.props.sitePlugin.getSettings(true)}
                    defaultSettings={defaultSiteSettings}
                    onDismiss={this.onDismissOptions}
                    onSaveSettings={this.onSaveOptions}
                />
            );
        }

        const downloadButtonProps = downloadButtonDefaultProps[this.state.downloadState];

        //TODO: fix mini-download button if the downloaded file exists
        return (
            <div
                id={n('ui')}
                className={mainClassNames}
                onMouseEnter={this.onMouseOver}
                onMouseLeave={this.onMouseOut}
            >
                <div id={n('badges')}>
                    <a id={n("close")} className={n("circlebtn")} title="Hide Raccoony"
                        onClick={this.onClickClose}
                    >{IconGlyph.Close}</a>
                    <a id={n('tabs')} className={n("circlebtn")} title="Open all in Tabs (Hotkey: T)"
                        onClick={this.onClickOpenTabs}
                        style={{ visibility: this.state.hasPageLinks ? 'visible' : 'hidden' }}
                    >{IconGlyph.OpenTabs}</a>
                    <a id={n('dl')} className={n("circlebtn")} title="Download (Hotkey: D)"
                        style={{ visibility: this.state.hasMedia && canDownload ? 'visible' : 'hidden' }}
                    >{IconGlyph.Download}</a>
                </div>
                <a id={n("imglink")} title="Raccoony - click for page options">
                    <img src={logoUrl} id={n("img")} width={64} height={64} />
                </a>
                <div id={n("ctr")} className={showBalloon ? null : n('inactive')}>
                    {alternateBalloonUi ?
                        (
                            alternateBalloonUi
                        ) : (
                            <div className={n("bubble")}>
                                {this.state.hasMedia && (
                                    <ActionButton
                                        onClick={this.onClickDownload}
                                        title={downloadButtonProps.disabled ? null : 'Hotkey: D'}
                                        icon={downloadButtonProps.icon}
                                        disabled={downloadButtonProps.disabled}
                                    >
                                        {downloadButtonProps.label}
                                    </ActionButton>
                                )}
                                {this.state.hasMedia && this.state.downloadState === DownloadState.Exists && (
                                    <ActionButton onClick={this.onClickOpenFolder} title="Hotkey: F" icon={IconGlyph.OpenFolder}>
                                        Open folder
                                    </ActionButton >
                                )}
                                {this.state.canFullscreen && !this.props.inFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconGlyph.Fullscreen}>
                                        Fullscreen
                                    </ActionButton>
                                )}
                                {this.props.inFullscreen && (
                                    <ActionButton onClick={this.onClickFullscreen} title="Hotkey: O" icon={IconGlyph.ExitFullscreen}>
                                        Exit fullscreen
                                    </ActionButton>
                                )}
                                {this.state.hasPageLinks && (
                                    <ActionButton onClick={this.onClickOpenTabs} title="Hotkey: T" icon={IconGlyph.OpenTabs}>
                                        Open all in tabs
                                    </ActionButton>
                                )}
                                <ActionButton
                                    onClick={this.onClickOptions}
                                    className={n('nolabel')}
                                    title="Configure Raccoony"
                                    icon={IconGlyph.Config}
                                ></ActionButton>
                            </div >
                        )}
                </div>
            </div>
        );
    }
}
