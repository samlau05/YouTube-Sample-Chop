console.log("YouTube Sampler content script loaded.");

// Function to get YouTube video ID from the URL
function getYouTubeVideoId() {
  let videoUrl = window.location.href;
  let url = new URL(videoUrl);
  let videoId = url.searchParams.get("v");
  return videoId;
}

document.addEventListener('keydown', function(event) {
  console.log('Key pressed:', event.key); // Log key press for debugging

  let player = document.querySelector('video');
  if (!player) {
    console.log('No video element found');
    return;
  }

  if (event.key === 'c') { // Set the key for capturing timestamps (e.g., 'C' for 'Capture')
    let currentTime = player.currentTime;
    let videoId = getYouTubeVideoId();

    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      console.log('Storage i guess: ', result[videoId]);
      timestamps.push(currentTime);
      let dataToStore = {};
      dataToStore[videoId] = timestamps;

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
