/*//////////////////////////////////////////////////////////////

Taken - https://github.com/michaeledwards91/twitch-giveaways

//////////////////////////////////////////////////////////////*/

let channel = getChannelName()
let button = document.createElement('a')
button.className = 'tga-button button button--icon-only float-left'
button.title = 'Open Twitch Giveaways'
button.target = '_blank'
button.innerHTML = '<svg width="20" height="20" viewBox="0 0 512 512"><g fill="#6441a4"><path d="M231 462h-162.875v-204.331h162.875v204.331zm0-301.331h-181v67h181v-67zm50 301.331h162.875v-204.331h-162.875v204.331zm0-301.331v67h181v-67h-181zm16.884-45h37.032c27.667 0 26.667-35.669 5.426-35.669-16.384 0-29.071 15.335-42.458 35.669zm51.458-65.669c63.574 0 62.908 90.669-.426 90.669h-91.166c12.673-27.625 38.166-90.669 91.592-90.669zm-174.184 30c-21.241 0-22.241 35.669 5.426 35.669h37.032c-13.387-20.334-26.074-35.669-42.458-35.669zm-9-30c53.426 0 78.919 63.044 91.592 90.669h-91.166c-63.334 0-64-90.669-.426-90.669z"/></g></svg>'

if (['www.twitch.tv', 'twitch.tv', 'go.twitch.tv'].indexOf(window.location.hostname) > -1) {
    let interval = setInterval(function (callback) {
        let container = document.querySelector('.chat-buttons-container')
        if (!container) container = document.querySelector('.chat-input__buttons-container')
        if (!container) return

        channel = getChannelName()
        if (!channel) return

        if (container.children[0].className === 'flex flex-row') {
            container = container.children[0]
            button.className = 'tw-button-icon'
            button.style.padding = '0 4px'
        }
        else button.style.padding = '4px'

        button.href = chrome.extension.getURL('main.html?channel=' + channel)
        if (button.parentNode !== container) {
            if (container.appendChild(button)) clearInterval(interval)
        }

    }, 1000)
}

function getChannelName() {
    let match = window.location.pathname.match(/^\/([^\/]+)(\/|$)/)
    return match ? match[1].toLowerCase() : null
}