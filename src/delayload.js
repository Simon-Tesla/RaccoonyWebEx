// TODO: if this page somehow manages to become more complex, consider rewriting in typescript.

function onLoad() {
    let url = new URL(window.location.href);
    let redirectUrl = url.searchParams.get('url');
    let delaySecs = url.searchParams.get('delay');
    let documentTitle = document.title;

    // Update the page with the info from the query string.
    let sub = document.getElementById("sub");
    if (!redirectUrl) {
        sub.textContent = "Error: invalid URL";
        return;
    }
    sub.href = redirectUrl;
    sub.textContent = redirectUrl;

    let time = document.getElementById("time");

    function countdown() {
        time.textContent = delaySecs;
        document.title = `(${delaySecs}) ${documentTitle}`;
        if (delaySecs > 0) {
            delaySecs--;
            setTimeout(countdown, 1000);
        } else {
            window.location = redirectUrl;
        }
    }
    countdown();
}

document.addEventListener("DOMContentLoaded", onLoad);