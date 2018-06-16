import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageAction } from './enums';
import * as I from './definitions';
import { getSitePlugin } from './plugins/index';
import * as logger from './logger'
import Page from './ui/page/page';
import SiteActions from './ui/siteActions';

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

    ReactDOM.render(<Page siteActions={actions} />, rootElt);
    console.log("finished page_inject");

    // TODO: add listener for context menu
})