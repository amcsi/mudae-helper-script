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
        
        if (v.innerText === '$w' || v.innerText === '$|') {
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
    console.error('Failed to find relevant element. Not starting the interval.');
}
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