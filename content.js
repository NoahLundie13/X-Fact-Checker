chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addButtons") {
    const buttonsAdded = addButtonsToTweets();
    if (sendResponse) {
      sendResponse({ count: buttonsAdded });
    }
  }
  return true;
});

function addButtonsToTweets() { 
  const style = document.createElement('style'); 
  style.textContent = ` 
    .tweet-extract-btn { 
      background-color: #1DA1F2; 
      color: white; 
      border: none; 
      border-radius: 4px; 
      padding: 4px 8px; 
      font-size: 12px; 
      cursor: pointer; 
      margin-top: 5px; 
      margin-bottom: 5px; 
    } 
    .tweet-extract-btn:hover { 
      background-color: #0c85d0; 
    } 
  `; 
  document.head.appendChild(style); 
 
  const tweetElements = document.querySelectorAll('article'); 
  let buttonsAdded = 0; 
 
  tweetElements.forEach((tweetElement) => { 
    if (tweetElement.querySelector('.tweet-extract-btn')) { 
      return; 
    } 
 
    const button = document.createElement('button'); 
    button.className = 'tweet-extract-btn'; 
    button.textContent = 'Extract Tweet'; 
 
    button.addEventListener('click', function(event) { 
      event.preventDefault(); 
      event.stopPropagation(); 
 
      let tweetText = ''; 
 
      const usernameElement = tweetElement.querySelector('[data-testid="User-Name"]'); 
      let username = 'Unknown User'; 
      if (usernameElement) { 
        username = usernameElement.innerText.split('\n')[0]; 
      } 
 
      const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]'); 
      if (tweetTextElement) { 
        tweetText = tweetTextElement.innerText.trim(); 
      } 
 
      const formattedTweet = `${username}: ${tweetText}`; 
      let fact_check = sendToServer(formattedTweet);
 
      //TODO: ADD POPUP WITH FACT CHECK 
 
    }); 
 
    const actionBar = tweetElement.querySelector('[role="group"]'); 
    if (actionBar) { 
      const buttonContainer = document.createElement('div'); 
      buttonContainer.style.marginLeft = '10px'; 
      buttonContainer.appendChild(button); 
 
      actionBar.appendChild(buttonContainer); 
      buttonsAdded++; 
    } 
  }); 
 
  return buttonsAdded; 
} 
 
addButtonsToTweets(); 
 
const observer = new MutationObserver(() => { 
  addButtonsToTweets();  
}); 
 
observer.observe(document.body, { childList: true, subtree: true });

function sendToServer(data) {
  fetch('http://127.0.0.1:5000/api/endpoint', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
      console.log("Success", result);
    })
  .catch(error => {
      console.error('Error:', error);
    })
}
