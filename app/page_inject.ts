import { MessageAction } from './enums';
import * as I from './definitions';
import FuraffinityPlugin from './plugins/furaffinity';

console.log("[rc] injecting script");

var faPlugin = new FuraffinityPlugin();
var mediaList: I.MediaList;


document.addEventListener("DOMContentLoaded", () => {
    console.log("[rc] content loaded, adding listener");
    faPlugin.getMediaList().then(list => {
        let button = document.createElement("button");
        button.style.position = "absolute";
        button.style.top = "100px";
        button.style.left = "10px";
        button.style.padding = "1em";
        button.innerHTML = "Test!!"
        button.onclick = () => {
            let message: I.MessageRequest<I.MediaList> = {
                action: MessageAction.OpenTabs,
                data: list,
            }
            console.log("[rc] sending message", message);
            browser.runtime.sendMessage(message);
        }
        document.body.appendChild(button);
    });
})