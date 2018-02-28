import * as React from 'react';
import * as I from '../../definitions';
import * as E from '../../enums'
import * as classnames from 'classnames';
import * as logger from '../../logger';
import PageOverlay from './pageOverlay';
import Lightbox from 'react-image-lightbox';
import SiteActions from '../siteActions'

interface PageProps {
    siteActions: SiteActions;
}

interface PageState {
    isFullscreen: boolean;
    lightboxUrl: string;
    lightboxTitle: string;
    settings: I.SiteSettings;
    enableZoom: boolean;
}

export default class Page extends React.Component<PageProps, PageState> {
    constructor(props: PageProps, context) {
        super(props, context);
        this.state = {
            lightboxUrl: '',
            lightboxTitle: '',
            isFullscreen: false,
            settings: null,
            enableZoom: true,
        }
        this.props.siteActions.getCurrentSettings().then((settings) => {
            this.setState({ settings });
        });
    }

    componentDidMount() {
        window.addEventListener("wheel", this.onWheel);
    }

    componentWillUnmount() {
        window.removeEventListener("wheel", this.onWheel);
    }

    componentDidUpdate(prevProps: PageProps, prevState: PageState) {
        if (!prevState.settings && this.state.settings) {
            // Updating in response to settings initialization
            if (this.state.settings.autoFullscreen) {
                this.enterFullscreen();
            }
        }
    }

    private onWheel = (ev: WheelEvent) => {
        if (!this.state.isFullscreen &&
            this.state.settings && this.state.settings.fullscreenScrollGestureEnabled &&
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

    onClickClose = () => {
        this.setState({ isFullscreen: false });
    }

    onChangeSettings = (settingsToSave: { defaultSettings?: I.SiteSettings; currentSettings?: I.SiteSettings; }) => {
        this.props.siteActions.saveSettings(settingsToSave)
            .then(() => this.props.siteActions.getCurrentSettings())
            .then((settings) => {
                this.setState({ settings });
            });
    }

    render() {
        if (!this.state.settings) {
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
                    siteActions={this.props.siteActions}
                    onClickFullscreen={this.onClickFullscreen}
                    inFullscreen={this.state.isFullscreen}
                    siteSettings={this.state.settings}
                    onChangeSettings={this.onChangeSettings}
                />
                {this.state.isFullscreen && (
                    <Lightbox
                        mainSrc={this.state.lightboxUrl}
                        onCloseRequest={this.onClickClose}
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
}