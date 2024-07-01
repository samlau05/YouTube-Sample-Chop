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
        li.appendChild(span);

        // Create a delete button
        let deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.addEventListener('click', function() {
          deleteTimestamp(videoId, index);
        });

        let keyBtn = document.createElement('button');
        keyBtn.textContent = 'Assign Key';
        keyBtn.addEventListener('click', function() {
          let key = prompt("Enter a key to assign:");
          if (key) {
            assignKey(index, key);
          }
        });

        li.appendChild(keyBtn);
        li.appendChild(deleteBtn);
        timestampsList.appendChild(li);
      });
    });
  });

  // Function for deleting a timestamp
  function deleteTimestamp(videoId, index) {
    chrome.storage.local.get({ [videoId]: [] }, function(result) {
      let timestamps = result[videoId];
      timestamps.splice(index, 1); // Remove the timestamp at the specified index
      let dataToStore = {};
      dataToStore[videoId] = timestamps;

      chrome.storage.local.set(dataToStore, function() {
        // After deletion, refresh the popup to reflect changes
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

  // Function to convert the seconds into a minutes seconds format
  function convertTime(timestamp) {
    var mins = Math.floor(timestamp / 60);
    var seconds = Math.round(timestamp % 60);
    var formattedTimestamp = mins + ":" + (seconds < 10 ? "0" : "") + seconds;
    return formattedTimestamp; 
  }

  function assignKey(index, key) {
    chrome.storage.local.get({keys: {}}, function(result) {
      let keys = result.keys;
      keys[key] = index;
      chrome.storage.local.set({keys: keys}, function() {
        console.log(`Key ${key} assigned to timestamp ${index}`);
      });
    });
  }

});
  

  