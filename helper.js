// This clears the last interval.
clearInterval(window.lastRemoverInterval);
(window.lastRemoverIntervals ?? []).forEach(clearInterval);
window.lastRemoverIntervals = [];

queryFrom = document.querySelector('main').parentElement;

secondsToClaim = 43;

function getClassNameStartingWith(name, queryFrom = document) {
  return [...(queryFrom.querySelector(`[class*=${name}-]`)?.classList ?? [])].find(v => v.startsWith(`${name}-`));
}

clsName = getClassNameStartingWith('messageContent', queryFrom);
// The one that will need to float left.
removerMessageClass = getClassNameStartingWith('cozyMessage', queryFrom);
avatarClassName = getClassNameStartingWith('avatar', queryFrom.querySelector(`.${removerMessageClass}`));

queryForRemover = `.${clsName}:not(.iMarkedThis)`;

function removerFn(isFirstRun) {
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

    const embedWrapper = messageElement.querySelector('[class*=embedWrapper-]')
    if (embedWrapper) {
      // It has an embed.
      messageElement.classList.add('hasEmbed');
      // Need to override the padding as important on the style element to counteract Discord's
      // setting of it when clicking to react with an emoji.
      messageElement.style.setProperty('padding', '0', 'important');

      if (!isFirstRun && messageElement.innerText.includes('React with any emoji to claim!')) {
        // Timer time!

        const timerDiv = document.createElement('div');
        timerDiv.classList.add('removerTimer');
        function setTimerSecondsLeft(secondsLeft) {
          if (secondsLeft) {
            timerDiv.innerHTML = `⏰ T-<strong>${secondsLeft}</strong>`;
          } else {
            timerDiv.innerText = `🔒 Time is up.`;
          }
        }
        embedWrapper.append(timerDiv);
        setTimerSecondsLeft(secondsToClaim);

        const startMillis = (new Date()).getTime();
        const interval = setInterval(() => {
          const secondsElapsed = Math.ceil(((new Date()).getTime() - startMillis) / 1000);
          const secondsLeft = secondsToClaim - secondsElapsed;
          setTimerSecondsLeft(secondsLeft);
          if (secondsLeft <= 0) {
            messageElement.classList.add('timeIsUp');
            clearInterval(interval);
          }
        }, 200);
        window.lastRemoverIntervals.push(interval);
      }
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

removerFn(true);
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
    .${removerMessageClass}.${removerMessageClass} {
        /* .group-start- */
        margin-top: 0;
        padding-top: 0;
        padding-bottom: 0;
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
    }
    div[class^=sidebar-]:not(:hover) {
        width: 50px;
    }
    .timeIsUp div[class^=embedWrapper-] {
        background-color: #111;
    }
    .removerTimer {
      color: white;
    }
`;
