import { MessageAction } from './enums';
import * as I from './definitions';

console.log("[rc] injecting script");

document.addEventListener("DOMContentLoaded", () => {
    console.log("[rc] content loaded, adding listener");
    let button = document.createElement("button");
    button.style.position = "absolute";
    button.style.top = "100px";
    button.style.left = "10px";
    button.style.padding = "1em";
    button.innerHTML = "Test!!"
    button.onclick = () => {
        console.log("[rc] sending message");
        let message: I.MessageRequest = {
            action: MessageAction.Test
        }
        browser.runtime.sendMessage(message);
    }
    document.body.appendChild(button);
})