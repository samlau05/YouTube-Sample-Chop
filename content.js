console.log("YouTube Sampler content script loaded.");

// Function to get YouTube video ID from the URL
function getYouTubeVideoId() {
  let videoUrl = window.location.href;
  let url = new URL(videoUrl);
  let videoId = url.searchParams.get("v");
  return videoId;
}

function loadChopDots() {
  let videoId = getYouTubeVideoId();
  chrome.storage.local.get({ [videoId]: [] }, function(result) {
    let timestamps = result[videoId];
    let player = document.querySelector('video');
    let progressBar = document.querySelector('.ytp-progress-bar-container');
    if (!player || !progressBar) return;

    let progressBarRect = progressBar.getBoundingClientRect();
    let progressBarWidth = progressBarRect.width;

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


// Function to add a dot at a specific timestamp position above the YouTube progress bar
function addChopDot(currentTime) {
  // Find the YouTube progress bar
  const player = document.querySelector('video');
  const progressBar = document.querySelector('.ytp-progress-bar-container');
  if (!player || !progressBar) return;

  let progressBarRect = progressBar.getBoundingClientRect();
  let progressBarWidth = progressBarRect.width;
  let dotPosition = (currentTime / player.duration) * progressBarWidth;

  // Check if a dot already exists at this position
  let existingDot = progressBar.querySelector(`.chop-dot[data-time="${currentTime}"]`);
  if (existingDot) return;

  let dot = document.createElement('div');
  dot.classList.add('chop-dot'); // Add a class for styling
  dot.style.left = dotPosition-6 + 'px';
  dot.setAttribute('data-time', currentTime); // Set a data attribute to identify the dot

  let progressBarContainer = document.querySelector('.ytp-progress-bar-container');
  if (progressBarContainer) {
    progressBarContainer.appendChild(dot);
  } else {
    console.error('Progress bar container not found.');
  }
}

document.addEventListener('keydown', function(event) {
  console.log('Key pressed:', event.key); // Log key press for debugging

  let player = document.querySelector('video');
  if (!player) {
    console.log('No video element found');
    return;
  }

  // CODE FOR CAPTURING TIMESTAMPS
  if (event.key === 's') { 
    let currentTime = player.currentTime;
    let videoId = getYouTubeVideoId();

    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      console.log('Storage i guess: ', result[videoId]);
      timestamps.push(currentTime);
      let dataToStore = {};
      dataToStore[videoId] = timestamps;

      // add a new chop dot
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

window.addEventListener('load', () => {
  loadChopDots();

  window.addEventListener('resize', loadChopDots);

  // Add mutation observer to detect changes in YouTube player size
  const playerContainer = document.querySelector('.html5-video-player');
  if (playerContainer) {
    const observer = new MutationObserver(() => {
      loadChopDots();
    });
    observer.observe(playerContainer, { attributes: true, childList: true, subtree: true });
  }

})