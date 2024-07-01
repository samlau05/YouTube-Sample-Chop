// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const settingsButton = document.querySelector('.settings-button');
  const mainContent = document.querySelector('.main-content');
  const settingsContent = document.querySelector('.settings-content');

  settingsButton.addEventListener('click', function() {
    mainContent.classList.toggle('hidden');
    settingsContent.classList.toggle('hidden');
  });

  let timestampsList = document.getElementById('timestamps');

  // Fetch the current active tab to get the URL
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    let url = tabs[0].url;
    let videoId = extractVideoId(url); // Extract video ID from URL

    // Retrieve timestamps from local storage based on videoId
    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      timestamps.forEach(function(timestamp, index) {
        let li = document.createElement('li');

        formattedTimestamp = convertTime(timestamp);

        // Create span for timestamp text
        let span = document.createElement('span');
        span.textContent = "Chop @ " + formattedTimestamp;

        // Assign key to timestamp
        assignKey(index);
        span.textContent += " | Key: " + (index + 1);

        li.appendChild(span);

        // Create a delete button
        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function() {
          deleteTimestamp(videoId, index); // Call delete function with videoId and index
        });

        li.appendChild(deleteBtn);
        timestampsList.appendChild(li);
      });

      // Display a message if no timestamps exist
      if (timestamps.length === 0) {
        let li = document.createElement('li');
        li.textContent = "Add some chops using the 's' key to get started";
        timestampsList.appendChild(li);
      }

    });
  });

  // Function for deleting a timestamp (now sends message to content script)
  function deleteTimestamp(videoId, index) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      let activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, {
        action: 'deleteTimestamp',
        payload: { videoId, index }
      }, function(response) {
        // Handle response if needed
        console.log(response.message);
        // Optionally, refresh the popup after deletion
        location.reload();
      });
    });
  }

  // Function to extract video ID from YouTube URL
  function extractVideoId(url) {
    let videoId = '';
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) {
      videoId = match[1];
    } else {
      // Handle cases where URL format might differ
      console.error("Could not extract video ID from URL:", url);
    }
    return videoId;
  }

  // Function to convert seconds into a minutes:seconds format
  function convertTime(timestamp) {
    var mins = Math.floor(timestamp / 60);
    var seconds = Math.round(timestamp % 60);
    var formattedTimestamp = mins + ":" + (seconds < 10 ? "0" : "") + seconds;
    return formattedTimestamp; 
  }

  // Function to assign a key to a timestamp
  function assignKey(index) {
    chrome.storage.local.get({ keys: {} }, function(result) {
      let keys = result.keys;
      let key = index + 1;
      keys[key] = index;
      chrome.storage.local.set({ keys: keys }, function() {
        console.log('Key ${key} assigned to timestamp ${index}');
      });
    });
  }
});
