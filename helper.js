// This clears the last interval.
clearInterval(window.lastRemoverInterval);
(window.lastRemoverIntervals ?? []).forEach(clearInterval);
window.lastRemoverIntervals = [];

queryFrom = document.querySelector('main').parentElement;

baseSecondsToClaim = 45;
// To be pessimistic and account for delays, let's always subtract this amount in advance for timers.
safetyBufferSeconds = 2;

function getClassNameStartingWith(name, queryFrom = document) {
  return [...(queryFrom.querySelector(`[class*=${name}-]`)?.classList ?? [])].find(v => v.startsWith(`${name}-`));
}

messagesContainerClass = getClassNameStartingWith('scrollerInner', queryFrom);

listItemClsName = getClassNameStartingWith('messageListItem', queryFrom);
messageContentClsName = getClassNameStartingWith('messageContent', queryFrom);
// The one that will need to float left.
removerMessageClass = getClassNameStartingWith('cozyMessage', queryFrom);
avatarClassName = getClassNameStartingWith('avatar', queryFrom.querySelector(`.${removerMessageClass}`));

queryForRemover = `.${listItemClsName}:not(.iMarkedThis)`;

// Types out text in the text input field.
function removerTypeText(textToType) {
  const typingContainer = queryFrom.querySelector(`[class*=slateTextArea-]`);
  if (!typingContainer) {
    console.warn('Typing container not found');
    return;
  }
  typingContainer.focus();
  typingContainer.click();

  const emptyStringElement = typingContainer.querySelector(`[data-slate-zero-width]`);
  if (emptyStringElement) {
    // Trick to allow typing to work even if the text box is currently empty.
    emptyStringElement.setAttribute('data-slate-string', '');
  }

  const typingArea = typingContainer.querySelector('[data-slate-string]');
  if (!typingArea) {
    console.warn('Could not find typing area');
    return;
  }
  typingArea.innerHTML = `${textToType}<br>`;
  typingContainer.focus();
  // Not doing the following would require you to add some typing unless it would just send the
  // placeholder that you typed.
  typingContainer.dispatchEvent(new window.KeyboardEvent('input', {
    bubbles: true,
    key: ' ',
  }));
}

function removerFn() {
  numRemoved = 0;
  var elements = queryFrom.querySelectorAll(queryForRemover);
  const numElements = elements.length;

  if (numElements) {
    console.info(`found ${numElements} elements`);
  }

  // If there are really large amount of unmarked messages, then we probably just ran the script, or just entered this channel.
  justEnteredChannel = numElements > 40;

  [...elements].map(messageElement => {
    messageElement.classList.add('iMarkedThis');

    const text = messageElement.getElementsByClassName(messageContentClsName)[0]?.innerText ?? '';

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

    if (
      (text.match(/\broll/i) && !text.includes('the roulette is limited to'))
      || text.includes('you can\'t claim for another')
      || text.includes('you can claim right now')
    ) {
      // A comment with "rolls" in it? Or a $tu result? Mark it with a class to do float clearing.
      try {
        messageElement.classList.add('rollText');
      } catch (e) {
        // Don't crash if e.g. the element to delete ends up being missing.
      }
    }

    const embedWrapper = messageElement.querySelector('[class*=embedWrapper-]')
    if (embedWrapper) {
      const cozyMessage = messageElement.getElementsByClassName(removerMessageClass)[0];

      // It has an embed.
      messageElement.classList.add('hasEmbed');
      // Need to override the padding as important on the style element to counteract Discord's
      // setting of it when clicking to react with an emoji.
      cozyMessage.style.setProperty('padding-right', '0', 'important');

      const innerText = messageElement.innerText;
      if (
        messageElement.querySelector('a[class*=embedImage-]')
        && !innerText.includes('Claim Rank:')
        && !(messageElement.querySelector('span[class*=embedFooterText-]')?.innerText ?? '').match(/^\d+\/\d+\b/)
      ) {
        // Timer time!

        let secondsToClaim = baseSecondsToClaim;
        if (messageElement.querySelector('div[class*=executedCommand-]')) {
          // The roll was a reply to a slash command. That means we have 2x the reaction time.
          secondsToClaim *= 2;
        }
        secondsToClaim -= safetyBufferSeconds;

        const alreadyClaimed = innerText.includes('Belongs to ');

        const timerDiv = document.createElement('div');
        timerDiv.classList.add('removerTimer');
        let interval;
        function setTimerSecondsLeft(secondsLeft) {
          if (secondsLeft > 0) {
            timerDiv.innerHTML = `⏰ T-<strong>${secondsLeft}</strong>`;
            return;
          }

          if (secondsLeft === false) {
            timerDiv.innerText = `🔒 Already claimed.`;
          } else {
            timerDiv.innerText = `🔒 Time is up.`;
          }
          messageElement.classList.add('timeIsUp');

          if (!interval) {
            return;
          }
          clearInterval(interval);
          const index = window.lastRemoverIntervals.indexOf(interval);
          if (index >= 0) {
            // Splice out the interval we already cleared.
            window.lastRemoverIntervals.splice(index, 1);
          }
        }
        embedWrapper.append(timerDiv);

        const nameElement = embedWrapper.querySelector('[class*=embedAuthor-]');
        // $im helper.
        if (nameElement) {
          const name = nameElement.innerText;
          const infoMarryLink = document.createElement('a');
          infoMarryLink.href = '#';
          infoMarryLink.addEventListener('mousedown', evt => {
            evt.preventDefault();
            // Type the name.
            removerTypeText(`$im ${name} $2`);
          });
          infoMarryLink.style.marginLeft = '8px';
          infoMarryLink.innerText = '$im';
          nameElement.appendChild(infoMarryLink);
        }

        if (alreadyClaimed) {
          setTimerSecondsLeft(false);
          return false;
        }
        if (justEnteredChannel) {
          setTimerSecondsLeft(0);
          return false;
        }

        setTimerSecondsLeft(secondsToClaim);

        const startMillis = (new Date()).getTime();
        interval = setInterval(() => {
          const secondsElapsed = Math.ceil(((new Date()).getTime() - startMillis) / 1000);
          const secondsLeft = secondsToClaim - secondsElapsed;
          setTimerSecondsLeft(secondsLeft);
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
if (!messageContentClsName) {
  throw 'Failed to find relevant element. Not starting the interval.';
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

var removerStyleEl = document.getElementById('removerStyle');
if (!removerStyleEl) {
  removerStyleEl = document.createElement("style")
  removerStyleEl.id = 'removerStyle';
  removerStyleEl.type = "text/css"
  document.head.appendChild(removerStyleEl);
}

// CSS.
removerStyleEl.innerHTML = `
    .${messagesContainerClass} {
        display: flex;
        flex-wrap: wrap;    
    }
    .${removerMessageClass} {
        /* Gives a tiny bit of room between rows of posts */
        margin-bottom: 5px;
    }
    .${removerMessageClass}:not(.rollText) {
        max-width: 230px !important;
    }
    .hasEmbed .${removerMessageClass}.${removerMessageClass} {
        /* .group-start- */
        margin-top: 0;
        padding-top: 0;
        padding-bottom: 0;
        padding-left: 0;
    }
    .hasEmbed .${avatarClassName} {
        display: none;
    }
    .rollText {
        width: 100%;
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
