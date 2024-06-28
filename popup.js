// popup.js
document.addEventListener('DOMContentLoaded', function() {
    let timestampsList = document.getElementById('timestamps');
  
    chrome.storage.local.get({timestamps: []}, function(result) {
      let timestamps = result.timestamps;
      timestamps.forEach(function(timestamp, index) {
        let li = document.createElement('li');
        li.textContent = timestamp;

        // create a delete button
        let deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>'; 
        deleteBtn.addEventListener('click', function() {
          deleteTimestamp(index);
        });
  
        li.appendChild(deleteBtn);

        timestampsList.appendChild(li);
      });
    });

    // function for deleting a timestamp
    function deleteTimestamp(index) {
        chrome.storage.local.get({timestamps: []}, function(result) {
          let timestamps = result.timestamps;
          timestamps.splice(index, 1); // Remove the timestamp at the specified index
          chrome.storage.local.set({timestamps: timestamps}, function() {
            // After deletion, refresh the popup to reflect changes
            location.reload();
          });
        });
      }
  
  });


  