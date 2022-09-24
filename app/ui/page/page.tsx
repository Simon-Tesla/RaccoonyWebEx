import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';
import PageOverlay from './pageOverlay';
import Lightbox from 'react-image-lightbox';
import SiteActions from '../siteActions'
import { initializeHotkeys } from './hotkeys';
import debounce from 'debounce';
import { CachedSettings } from '../../settings';
import { sendMessage, sendDownloadMediaMessage } from '../../utils/messaging';
import { sleep } from '../../utils/sleep';

interface PageProps {
    siteActions: SiteActions;
}

interface PageState extends I.AppState {
    lightboxUrl: string;
    lightboxTitle: string;
    siteSettings: I.SiteSettings;
    settings: I.Settings;
    enableZoom: boolean;
}

export default class Page extends React.Component<PageProps, PageState> implements I.UserActions {
    private settingsProvider: CachedSettings;

    private _hotkeysDisposer: () => void;

    constructor(props: PageProps, context) {
        super(props, context);
        this.state = {
            lightboxUrl: '',
            lightboxTitle: '',
            siteSettings: null,
            settings: null,
            enableZoom: true,

            hasMedia: false,
            hasPageLinks: false,
            canFullscreen: false,
            downloadState: E.DownloadState.NotDownloaded,
            showOptions: false,
            isFullscreen: false,
        }

        this.props.siteActions.registerPageChangeHandler(debounce(this.handlePageChange, 200));

        this.settingsProvider = new CachedSettings();
        this.settingsProvider.ready.then(this.onSettingsStoreUpdate);
        this.settingsProvider.addListener(this.onSettingsStoreUpdate);

        this.initialize();
    }

    componentDidMount() {
        window.addEventListener("wheel", this.onWheel);
    }

    componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);
        this.disableHotkeys();
    }

    componentDidUpdate(prevProps: PageProps, prevState: PageState) {
        if (!prevState.siteSettings && this.state.siteSettings) {
            // Updating in response to settings initialization
            if (this.state.siteSettings.autoFullscreen) {
                this.enterFullscreen();
            }
        }
        if (this.state.siteSettings && this.state.siteSettings.hotkeysEnabled) {
            this.enableHotkeys();
        }
        else {
            this.disableHotkeys();
        }
    }

    onSettingsStoreUpdate = () => {
        const siteName = this.props.siteActions.siteName;
        const siteSettings = this.settingsProvider.getCurrentSettings(siteName);
        const settings = this.settingsProvider.getSettings(siteName)
        this.setState({
            siteSettings,
            settings
        });
    }

    openPageLinksInTabs = (overrideNewTabBehavior = false) => {
        this.props.siteActions.getPageLinkList().then((list) => {
            list.overrideNewTabBehavior = overrideNewTabBehavior;
            sendMessage(E.MessageAction.OpenTabs, list);
        });
    }

    downloadMedia = (force: boolean = false) => {
        this.props.siteActions.getMedia().then((media) => {
            if (!media) {
                return;
            }
            const { downloadState } = this.state;
            if (!force && (downloadState === E.DownloadState.InProgress ||
                downloadState === E.DownloadState.Done ||
                downloadState === E.DownloadState.Exists)) {
                // If downloading has already started, then don't try to re-download.
                return;
            }

            this.setState({ downloadState: E.DownloadState.InProgress });
            sendDownloadMediaMessage(media)
                .then((download: I.DownloadResponse) => {
                    // The download promise resolves when the download starts, not when it finishes.
                    // May want to figure out how to get the download end event.
                    this.setState({
                        downloadState: download.success ? E.DownloadState.Done : E.DownloadState.Error,
                    })
                    setTimeout(() => this.setState({
                        downloadState: download.success ? E.DownloadState.Exists : E.DownloadState.NotDownloaded,
                    }), 2000);
                })
        });
    }

    showDownloadMedia = () => {
        // TODO: cache the download ID for already downloaded files?
        this.props.siteActions.getMedia()
            .then((media) => {
                sendMessage(E.MessageAction.ShowFile, media);
            });
    }

    toggleFullscreen = () => {
        this.onClickFullscreen();
    }

    openOptions = () => {
        this.setState({ showOptions: true });
    }

    dismissOptions = () => {
        this.setState({ showOptions: false });
    }

    showGlobalOptions = () => {
        sendMessage(E.MessageAction.ShowGlobalOptions, {});
    }

    onClickFullscreen = () => {
        if (this.state.isFullscreen) {
            this.setState({ isFullscreen: false });
        }
        else {
            this.enterFullscreen();
        }
    }

    onFullscreenError = () => {
        this.setState({ isFullscreen: false });
    }

    onClickLightboxClose = () => {
        this.setState({ isFullscreen: false });
    }

    onChangeSettings = (settingsToSave: I.Settings) => {
        this.props.siteActions.saveSettings(settingsToSave);
    }

    render() {
        if (!this.state.siteSettings) {
            // Wait for settings to load before showing the UI
            return null;
        }
        //TODO: add toolbar buttons for Raccoony actions in the lightbox?
        let title = this.state.lightboxTitle && (
            <span>{this.state.lightboxTitle}</span>
        );

        return (
            <div>
                <PageOverlay
                    userActions={this}
                    siteActions={this.props.siteActions}
                    onClickFullscreen={this.onClickFullscreen}
                    isFullscreen={this.state.isFullscreen}
                    siteSettings={this.state.siteSettings}
                    settings={this.state.settings}
                    onChangeSettings={this.onChangeSettings}
                    hasMedia={this.state.hasMedia}
                    hasPageLinks={this.state.hasPageLinks}
                    canFullscreen={this.state.canFullscreen}
                    downloadState={this.state.downloadState}
                    showOptions={this.state.showOptions}
                />
                {this.state.isFullscreen && (
                    <Lightbox
                        mainSrc={this.state.lightboxUrl}
                        onCloseRequest={this.onClickLightboxClose}
                        reactModalStyle={{
                            overlay: { zIndex: 1000000 }
                        }}
                        imageTitle={title}
                        onImageLoadError={this.onFullscreenError}
                        enableZoom={this.state.enableZoom}
                    />
                )}
            </div>
        );
    }

    private async initialize() {
        logger.log("initializing page UI");
        const hasMedia = await this.props.siteActions.hasMedia();
        logger.log("hasMedia", hasMedia);
        this.setState({
            hasMedia,
        });
        if (hasMedia) {
            // Check to see if the file has been downloaded
            const media = await this.props.siteActions.checkFileDownload();
            if (media) {
                if (media.type === E.MediaType.Image) {
                    this.setState({ canFullscreen: true });
                }
                const isDownloaded: boolean = await sendMessage(E.MessageAction.CheckDownload, media);
                if (isDownloaded) {
                    this.setState({ downloadState: E.DownloadState.Exists });
                }
                else {
                    // Wait for the settings to be ready before checking for the autoDownload setting.
                    await this.settingsProvider.ready;
                    // And an extra delay for state to settle. 
                    // This is a bit hackish, as we could initialize the download sooner if we waited on the setState call
                    // somehow, but starting the auto-download isn't exactly time-critical either.
                    // Also, I'd like to refactor all of this with hooks and context at some point anyway.
                    await sleep(200);
                    if (this.state.siteSettings.autoDownload) {
                        this.downloadMedia();
                    }
                }   
            }
        }
        
        const hasPageLinks = await this.props.siteActions.hasPageLinkList();
        logger.log("hasPageLinks", hasPageLinks);
        this.setState({
            hasPageLinks,
        });
    }

    private enableHotkeys() {
        if (!this._hotkeysDisposer) {
            this._hotkeysDisposer = initializeHotkeys(this);
        }
    }

    private disableHotkeys() {
        this._hotkeysDisposer && this._hotkeysDisposer();
    }

    private onWheel = (ev: WheelEvent) => {
        if (!this.state.isFullscreen &&
            this.state.siteSettings && this.state.siteSettings.fullscreenScrollGestureEnabled &&
            ev.deltaY < 0 && window.scrollY === 0
        ) {
            //Disable zoom for half a second to prevent the scroll from zooming the picture.
            this.setState({ enableZoom: false });
            this.enterFullscreen();
            setTimeout(() => this.setState({ enableZoom: true }), 500);
        }
    }

    private enterFullscreen() {
        this.props.siteActions.getMedia().then((media) => {
            if (media && media.type === E.MediaType.Image) {
                this.setState({
                    lightboxUrl: media.url,
                    lightboxTitle: media.title,
                    isFullscreen: true,
                });
            }
        });
    }

    private handlePageChange = () => {
        this.initialize();
    }
}
