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

// Function to add a dot at a specific timestamp position
function addChopDot(currentTime, index) {
  const player = document.querySelector('video');
  const container = getChopDotContainer();
  if (!player || !container) return;

  // This only works when the video does not have any chapters... future fix
  let dotPosition = (currentTime / player.duration) * container.offsetWidth;

  let dot = document.createElement('div');
  dot.classList.add('chop-dot'); // Add a class for styling
  dot.style.left = dotPosition-7 + 'px';
  dot.innerHTML = index + 1;

  container.appendChild(dot);
}

// Function to update chop dot positions
function updateChopDotPositions() {
  console.log("UPDATING CHOP POSITIONS");
  let videoId = getYouTubeVideoId();
  console.log("VIDEO ID: " + videoId);
  chrome.storage.local.get({ [videoId]: [] }, function(result) {
    let timestamps = result[videoId];
    let player = document.querySelector('video');
    let container = getChopDotContainer();
    if (!player || !container) return;

    container.innerHTML = ''; // Clear existing dots before re-rendering

    timestamps.forEach(function(timestamp, index) {
      addChopDot(timestamp, index);
    });
  });
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

    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      console.log('Storage: ', result[videoId]);
      timestamps.push(currentTime);

      // Sort timestamps immediately after adding
      timestamps.sort((a, b) => a - b);

      let dataToStore = {};
      dataToStore[videoId] = timestamps;

      chrome.storage.local.set(dataToStore, function() {
        console.log('Timestamp captured:', currentTime, 'for video ID:', videoId);
        updateChopDotPositions();
      });
    });
  } 
});

// Listen for messages from the extension popup or other parts of the extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'deleteTimestamp') {
    let { videoId, index } = request.payload;

    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      timestamps.splice(index, 1); // Remove the timestamp at the specified index
      let dataToStore = {};
      dataToStore[videoId] = timestamps;

      chrome.storage.local.set(dataToStore, function() {
        // Optionally send a response if needed
        sendResponse({ message: 'Timestamp deleted successfully' });
        updateChopDotPositions();
      });
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

// Ensure the page is fully loaded before applying dots
window.addEventListener('load', function() {
  updateChopDotPositions();
});

// Update chop dot positions when the window is resized
window.addEventListener('resize', function() {
  updateChopDotPositions();
});

// Update chop dot positions when the player mode is changed
document.addEventListener('fullscreenchange', function() {
  updateChopDotPositions();
});

// Listen for Theater mode button click
document.querySelector('.ytp-size-button').addEventListener('click', function() {
  console.log("THEATER BUTTON PRESSED");
  updateChopDotPositions();
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const { message } = request;
  console.log('chrome.runtime onMessage', message);
  if (message === 'URL updated') {
    updateChopDotPositions();
  }
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

        chrome.storage.local.get({ [videoId]: [] }, function(result) {
          let timestamps = result[videoId];
          if (timestamps[timestampIndex] !== undefined) {
            player.currentTime = timestamps[timestampIndex];
          }
        });
      }
    }, true);
  }
});