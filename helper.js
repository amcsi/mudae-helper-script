// This clears the last interval.
clearInterval(window.lastRemoverInterval);

clsName = [...(document.querySelector('[class*=messageContent-]')?.classList ?? [])].find(v => v.startsWith('messageContent-'));

queryForRemover = `.${clsName}:not(.iHidThis)`;

function removerFn() {
    numRemoved = 0;
    var elements = document.querySelectorAll(queryForRemover);
    [...elements].map(v => {
        
        if (v.innerText === '$w') {
            try {
                v.closest('[role=listitem]').style.display = "none";
                v.classList.add('iHidThis');
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
window.lastRemoverInterval = setInterval(removerFn, 2000);