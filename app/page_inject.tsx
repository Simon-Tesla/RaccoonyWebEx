import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageAction, DownloadDestination } from './enums';
import * as I from './definitions';
import { getSitePlugin } from './plugins/index';
import * as logger from './logger'
import Page from './ui/page/page';
import SiteActions from './ui/siteActions';
import { initPageListeners } from './ui/pageListeners';
import { sendDownloadMediaMessage } from './utils/messaging';

logger.log("injecting script");

document.addEventListener("DOMContentLoaded", () => {
    let plugin = getSitePlugin(window.location.hostname);
    if (!plugin) {
        logger.log("no plugin found for this site");
        return;
    }
    logger.log("loading plugin", plugin.siteName);

    const actions = new SiteActions(plugin);

    let rootElt = document.createElement('div');
    rootElt.id = "raccoonyExtensionRoot";
    document.body.appendChild(rootElt);

    let ref: Page = null;
    ReactDOM.render(<Page siteActions={actions} ref={r => ref = r} />, rootElt);
    console.log("finished page_inject");

    initPageListeners(actions, onContextDownloadHandlerFactory(ref));
})


function onContextDownloadHandlerFactory(userActions: I.UserActions) {
    return (media: I.Media) => {
        if (media.downloadDestination === DownloadDestination.Default) {
            userActions.downloadMedia(true);
        }
        else {
            sendDownloadMediaMessage(media);
        }
    }
}