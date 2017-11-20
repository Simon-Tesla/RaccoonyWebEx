import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { MessageAction } from './enums';
import * as I from './definitions';
import FuraffinityPlugin from './plugins/furaffinity';
import * as logger from './logger'
import PageOverlay from './ui/page/pageOverlay';

logger.log("injecting script");

//TODO: select the right plugin for the current site
var faPlugin = new FuraffinityPlugin();
var mediaList: I.PageLinkList;


document.addEventListener("DOMContentLoaded", () => {
    logger.log("content loaded, adding listener");

    let rootElt = document.createElement('div');
    rootElt.id = "raccoonyExtensionRoot";
    document.body.appendChild(rootElt);

    ReactDOM.render(<PageOverlay sitePlugin={faPlugin} />, rootElt);

    //faPlugin.getPageLinkList().then(list => {
    //    let button = document.createElement("button");
    //    button.style.position = "fixed";
    //    button.style.bottom = "10px";
    //    button.style.left = "10px";
    //    button.style.padding = "1em";
    //    button.style.width = '100px';
    //    button.innerHTML = "Tabs"
    //    button.onclick = () => {
    //        let message: I.MessageRequest<I.PageLinkList> = {
    //            action: MessageAction.OpenTabs,
    //            data: list,
    //        }
    //        logger.log("sending message", message);
    //        browser.runtime.sendMessage(message);
    //    }
    //    document.body.appendChild(button);
    //});

    //faPlugin.getMedia().then(media => {
    //    let button = document.createElement("button");
    //    button.style.position = "fixed";
    //    button.style.bottom = "10px";
    //    button.style.left = "120px";
    //    button.style.padding = "1em";
    //    button.style.width = '100px';
    //    button.innerHTML = "Download"
    //    button.onclick = () => {
    //        let message: I.MessageRequest<I.Media> = {
    //            action: MessageAction.Download,
    //            data: {
    //                sourceUrl: window.location.href,
    //                ...media
    //            },
    //        }
    //        logger.log("sending message", message);
    //        browser.runtime.sendMessage(message);
    //    }
    //    document.body.appendChild(button);
    //});
})