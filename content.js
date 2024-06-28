console.log("YouTube Sampler content script loaded.");

document.addEventListener('keydown', function(event) {
  console.log('Key pressed:', event.key); // Log key press for debugging

  let player = document.querySelector('video');
  if (!player) {
    console.log('No video element found');
    return;
  }

  if (event.key === 'c') { // Set the key for capturing timestamps (e.g., 'C' for 'Capture')
    let currentTime = player.currentTime;
    chrome.storage.local.get({timestamps: []}, function(result) {
      let timestamps = result.timestamps;
      timestamps.push(currentTime);
      chrome.storage.local.set({timestamps: timestamps}, function() {
        console.log('Timestamp captured:', currentTime);
      });
    });
  } else {
    chrome.storage.local.get({keys: {}}, function(result) {
      let keys = result.keys;
      if (keys[event.key] !== undefined) {
        let timestampIndex = keys[event.key];
        chrome.storage.local.get({timestamps: []}, function(result) {
          let timestamps = result.timestamps;
          if (timestamps[timestampIndex] !== undefined) {
            player.currentTime = timestamps[timestampIndex];
          }
        });
      }
    });
  }
});
