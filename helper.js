// This clears the last interval.
clearInterval(window.lastRemoverInterval);

queryFrom = document.querySelector('main').parentElement;

function getClassNameStartingWith(name, queryFrom = document) {
  return [...(queryFrom.querySelector(`[class*=${name}-]`)?.classList ?? [])].find(v => v.startsWith(`${name}-`));
}

clsName = getClassNameStartingWith('messageContent', queryFrom);
avatarClassName = getClassNameStartingWith('avatar', queryFrom.querySelector(['[data-list-id="chat-messages"]']));

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

    const text = v.innerText;

    const messageElement = v.closest('[role=listitem]');

    if (text.match(/^\$[wh][ga]?$/)) {
      // Roll command. Hide the text.

      try {
        messageElement.style.display = "none";
      } catch (e) {
        // Don't crash if e.g. the element to delete ends up being missing.
      }

      numRemoved += 1;
      return true;
    }

    if (text.match(/\broll/i) || text.includes("you can't claim for another") || text.includes('you can claim right now')) {
      // A comment with "rolls" in it? Or a $tu result? Mark it with a class to do float clearing.
      try {
        messageElement.classList.add('rollText');
      } catch (e) {
        // Don't crash if e.g. the element to delete ends up being missing.
      }
    }

    if (messageElement.querySelector('[class*=embedWrapper-]')) {
      // It has an embed.
      messageElement.classList.add('hasEmbed');
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
removerMessageClass = getClassNameStartingWith('cozyMessage', queryFrom);

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
  removerStyleEl.id = 'removerStyle';
  removerStyleEl.type = "text/css"
  document.head.appendChild(removerStyleEl);
}

// CSS.
removerStyleEl.innerHTML = `
    .${removerMessageClass} {
        float: left;
        max-width: 230px !important;
    }
    .${removerMessageClass}.hasEmbed {
        padding: 0 !important;
    }
    .hasEmbed .${avatarClassName} {
        display: none;
    }
    .${removerMessageClass}.${removerMessageClass}:not(.rollText) {
        min-height: 585px;
    }
    .rollText {
        float: none;
        clear: both;
        height: 50px;
    }

    div[class^=sidebar-]:not(:hover) {
        width: 50px;
    }
`;
