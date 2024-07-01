console.log("YouTube Sampler content script loaded.");

// Function to get YouTube video ID from the URL
function getYouTubeVideoId() {
  let videoUrl = window.location.href;
  let url = new URL(videoUrl);
  let videoId = url.searchParams.get("v");
  return videoId;
}

// Function to add a dot at a specific timestamp position above the YouTube progress bar
function addChopDot(currentTime) {
  // Find the YouTube progress bar 
  const player = document.querySelector('video');
  const progressBar = document.querySelector('.ytp-progress-bar-container');
  if (!player || !progressBar) return;

  let progressBarRect = progressBar.getBoundingClientRect();
  let progressBarWidth = progressBarRect.width;
  let dotPosition = (currentTime / player.duration) * progressBarWidth;

  let dot = document.createElement('div');
  dot.classList.add('chop-dot'); // Add a class for styling
  dot.style.left = dotPosition + 'px';
  dot.setAttribute('data-time', currentTime); // Set a data attribute to identify the dot

  progressBar.appendChild(dot);
}

// Function to update chop dot positions
function updateChopDotPositions() {
  let videoId = getYouTubeVideoId();
  chrome.storage.local.get({ [videoId]: [] }, function(result) {
    let timestamps = result[videoId];
    let player = document.querySelector('video');
    let progressBar = document.querySelector('.ytp-progress-bar-container');
    if (!player || !progressBar) return;

    let progressBarRect = progressBar.getBoundingClientRect();
    let progressBarWidth = progressBarRect.width;

    // Clear existing dots before re-rendering
    document.querySelectorAll('.chop-dot').forEach(dot => dot.remove());

    timestamps.forEach(function(timestamp) {
      let dotPosition = (timestamp / player.duration) * progressBarWidth;

      let dot = document.createElement('div');
      dot.classList.add('chop-dot'); // Add a class for styling
      dot.style.left = dotPosition-6 + 'px';
      dot.setAttribute('data-time', timestamp); // Set a data attribute to identify the dot

      progressBar.appendChild(dot);
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
      console.log('Storage i guess: ', result[videoId]);
      timestamps.push(currentTime);
      let dataToStore = {};
      dataToStore[videoId] = timestamps;

      // Add a new chop dot
      addChopDot(currentTime);

      chrome.storage.local.set(dataToStore, function() {
        console.log('Timestamp captured:', currentTime, 'for video ID:', videoId);
      });
    });
  } else {
    chrome.storage.local.get({ keys: {} }, function(result) {
      let keys = result.keys;
      if (keys[event.key] !== undefined) {
        let timestampIndex = keys[event.key];
        let videoId = getYouTubeVideoId();

        chrome.storage.local.get({ [videoId]: [] }, function(result) {
          let timestamps = result[videoId];
          if (timestamps[timestampIndex] !== undefined) {
            player.currentTime = timestamps[timestampIndex];
          }
        });
      }
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
        
        // could definitely be improved here for future... maybe set an id for each chop dot that includes the timestamp, then delete that specific
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
