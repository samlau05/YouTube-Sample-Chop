console.log("YouTube Sampler content script loaded.");

// Function to get YouTube video ID from the URL
function getYouTubeVideoId() {
  let videoUrl = window.location.href;
  let url = new URL(videoUrl);
  let videoId = url.searchParams.get("v");
  return videoId;
}

// Function to create or get the chop dot container
function getChopDotContainer() {
  let container = document.querySelector('.chop-dot-container');
  if (!container) {
    container = document.createElement('div');
    container.classList.add('chop-dot-container');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none'; // Ensure it doesn't interfere with clicks

    const progressBar = document.querySelector('.ytp-progress-bar-container');
    if (progressBar) {
      progressBar.appendChild(container);
    }
  }
  return container;
}

function calculateChopDopPosition(currentTime) {
  const player = document.querySelector('video');
  const container = getChopDotContainer();
  if (!player || !container) return;
  return (currentTime / player.duration) * container.offsetWidth;
}

// Function to add a dot at a specific timestamp position
function addChopDot(dotPosition, index) {
  const player = document.querySelector('video');
  const container = getChopDotContainer();
  if (!player || !container) return;
  let dot = document.createElement('div');

  // styling + positioning
  dot.classList.add('chop-dot'); 
  dot.style.left = dotPosition-7 + 'px';
  dot.id = dotPosition;
  dot.innerHTML = index + 1;

  // append to the chopDot container
  container.appendChild(dot);
}

/*
deleteChopDot
*/
function deleteChopDot(chopDotPosition, index, chopDotPositions) {
  console.log(chopDotPosition);
  let escapedChopDotPosition = CSS.escape(chopDotPosition);
  let dotToDelete = document.querySelector(`#${escapedChopDotPosition}`);
  if (dotToDelete) {
    dotToDelete.remove();
    for(let i = index; i < chopDotPositions.length; i++) {
      let escapedCurrPosition = CSS.escape(chopDotPositions[i]);
      let currDot = document.querySelector(`#${escapedCurrPosition}`);
      console.log(currDot);
      currDot.innerHTML = index + 1;
    }
  }
}

function loadChopDots() {
  let videoId = getYouTubeVideoId();
  if(!videoId) return;
  chrome.storage.local.get({ [videoId]: { timestamps: [], chopDotPositions: [] }}, function(result) {
    let { timestamps = [], chopDotPositions = [] } = result[videoId] || {};

    if(!chopDotPositions) return;

    // first create the ChopDot container div and make sure it's clear
    let container = getChopDotContainer();
    container.innerHTML = "";

    // now add each dot to this div
    chopDotPositions.forEach(function(chopDotPosition, index) {
      addChopDot(chopDotPosition, index);
    });
  });
}

function init() {
  loadChopDots();
}

document.addEventListener('keydown', function(event) {
  console.log('Key pressed:', event.key); // Log key press for debugging

  let player = document.querySelector('video');
  if (!player) {
    console.log('No video element found');
    return;
  }

  // Code for capturing timestamps
  if (event.key === 's') { 
    let currentTime = player.currentTime;
    let videoId = getYouTubeVideoId();

    if(videoId === null ) { return; }

    chrome.storage.local.get({ [videoId]: { timestamps: [], chopDotPositions: [] }}, function(result) {
      let { timestamps = [], chopDotPositions = [] } = result[videoId] || {};

      console.log('Storage: ', result[videoId]);
      timestamps.push(currentTime);

      // Sort timestamps immediately after adding
      timestamps.sort((a, b) => a - b);

      // set chopdot info
      let newDotPosition = calculateChopDopPosition(currentTime)
      chopDotPositions.push(newDotPosition);
      let index = (chopDotPositions.length) - 1;
      addChopDot(newDotPosition, index);

      let dataToStore = {};
      dataToStore[videoId] = { timestamps: timestamps, chopDotPositions: chopDotPositions };

      chrome.storage.local.set(dataToStore, function() {
        console.log('Timestamp captured:', currentTime, 'for video ID:', videoId);
      });
    });
  } 
});

// Listen for messages from the extension popup or other parts of the extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'deleteTimestamp') {
    let { videoId, index } = request.payload;

    chrome.storage.local.get({ [videoId]: { timestamps: [], chopDotPositions: [] }}, function(result) {
      let { timestamps = [], chopDotPositions = [] } = result[videoId] || {};

      let positionToDelete = chopDotPositions[index];

      // remove the info stored at that position
      timestamps.splice(index, 1); 
      chopDotPositions.splice(index, 1);

      deleteChopDot(positionToDelete, index, chopDotPositions);
      
      let dataToStore = {};
      dataToStore[videoId] = { timestamps: timestamps, chopDotPositions: chopDotPositions };

      chrome.storage.local.set(dataToStore, function() {
        // Optionally send a response if needed
        sendResponse({ message: 'Timestamp deleted successfully' });
      });
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

// Ensure the page is fully loaded before applying dots
window.addEventListener('load', function() {
  init();
});

// // Update chop dot positions when the window is resized
// window.addEventListener('resize', function() {
//   updateChopDotPositions();
// });

// // Update chop dot positions when the player mode is changed
// document.addEventListener('fullscreenchange', function() {
//   updateChopDotPositions();
// });

// // Listen for Theater mode button click
// document.querySelector('.ytp-size-button').addEventListener('click', function() {
//   console.log("THEATER BUTTON PRESSED");
//   updateChopDotPositions();
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { message } = request;
  if (message === 'URL updated') {
    init();
  }
  console.log('chrome.runtime onMessage', message);
});


document.addEventListener('readystatechange', function() {
  if (document.readyState === 'complete') {
    document.addEventListener('keydown', (event) => {
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        const player = document.querySelector('video');
        let videoId = getYouTubeVideoId();
        const numberKey = parseInt(event.key, 10);
        const timestampIndex = numberKey - 1;

        chrome.storage.local.get({ [videoId]: { timestamps: [], chopDotPositions: [] }}, function(result) {
          let { timestamps = [], chopDotPositions = [] } = result[videoId] || {};
          if (timestamps[timestampIndex] !== undefined) {
            player.currentTime = timestamps[timestampIndex];
          }
        });
      }
    }, true);
  }
});