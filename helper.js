// This clears the last interval.
clearInterval(window.lastRemoverInterval);

queryFrom = document.querySelector('main').parentElement;

clsName = [...(queryFrom.querySelector('[class*=messageContent-]')?.classList ?? [])].find(v => v.startsWith('messageContent-'));

queryForRemover = `.${clsName}:not(.iMarkedThis)`;

function removerFn() {
    if (document.hidden || window.removerInactive) {
        // Window is not active. Do not waste CPU.
        return;
    }
    numRemoved = 0;
    var elements = queryFrom.querySelectorAll(queryForRemover);
    [...elements].map(v => {
        v.classList.add('iMarkedThis');
        
        if (v.innerText.match(/^\$[wh][ga]?$/)) {
            // Roll command. Hide the text.

            try {
                v.closest('[role=listitem]').style.display = "none";
            } catch (e) {
                // Don't crash if e.g. the element to delete ends up being missing.
            }

            numRemoved += 1;
            return true;
        }
        
        return false;
    });
    if (numRemoved) {
        console.info(`removed ${numRemoved} comments`);
    }
}
if (!clsName) {
    throw 'Failed to find relevant element. Not starting the interval.';
}
// The one that will need to float left.
removerMessageClass = [...(queryFrom.querySelector('[class*=cozyMessage-]').classList ?? [])].find(v => v.startsWith('message-'));

window.lastRemoverInterval = setInterval(removerFn, 200);

// These event listeners prevent the script running while the window is inactive. This includes if focus is on the Dev Tools.
window.removeEventListener('blur', window.removerOnWindowBlur);
window.removeEventListener('focus', window.removerOnWindowFocus);
window.removerOnWindowBlur = function() {
    window.removerInactive = true;
}
window.removerOnWindowFocus = function() {
    window.removerInactive = false;
}
window.addEventListener('focus', window.removerOnWindowFocus);
window.addEventListener('blur', window.removerOnWindowBlur);

var removerStyleEl = document.getElementById('removerStyle');
if (!removerStyleEl) {
    removerStyleEl = document.createElement("style")
    removerStyleEl.type = "text/css"
    document.head.appendChild(removerStyleEl);
}

// CSS.
removerStyleEl.innerText = `
    .${removerMessageClass} {
        float: left;
    }
`;