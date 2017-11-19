import { MessageAction } from './enums';
import * as I from './definitions';
import FuraffinityPlugin from './plugins/furaffinity';
import * as logger from './logger'

logger.log("injecting script");

var faPlugin = new FuraffinityPlugin();
var mediaList: I.PageLinkList;


document.addEventListener("DOMContentLoaded", () => {
    logger.log("content loaded, adding listener");
    faPlugin.getPageLinkList().then(list => {
        let button = document.createElement("button");
        button.style.position = "fixed";
        button.style.bottom = "10px";
        button.style.left = "10px";
        button.style.padding = "1em";
        button.style.width = '100px';
        button.innerHTML = "Tabs"
        button.onclick = () => {
            let message: I.MessageRequest<I.PageLinkList> = {
                action: MessageAction.OpenTabs,
                data: list,
            }
            logger.log("sending message", message);
            browser.runtime.sendMessage(message);
        }
        document.body.appendChild(button);
    });

    faPlugin.getMedia().then(media => {
        let button = document.createElement("button");
        button.style.position = "fixed";
        button.style.bottom = "10px";
        button.style.left = "120px";
        button.style.padding = "1em";
        button.style.width = '100px';
        button.innerHTML = "Download"
        button.onclick = () => {
            let message: I.MessageRequest<I.Media> = {
                action: MessageAction.Download,
                data: media,
            }
            logger.log("sending message", message);
            browser.runtime.sendMessage(message);
        }
        document.body.appendChild(button);
    });
})