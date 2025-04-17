chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "addButtons") {
    const buttonsAdded = addButtonsToTweets();
    if (sendResponse) {
      sendResponse({ count: buttonsAdded });
    }
  }
  return true;
});

//TODO: Video Support?
//TODO: Host the server, and publish to google chrome store
//TODO: Improve Speeds -> Background Processing?
//TODO: Film Demo
//TODO: mini ml model for claim detection
//TODO: Add fact check button if image but no text
//TODO: Secure server with request origin specification

function addButtonsToTweets() {
  const style = document.createElement('style');
  style.textContent = `
    .tweet-extract-btn {
      background-color: transparent;
      color: white;
      border: none;
      width: 40px;               
      height: 40px;
      border-radius: 50%;
      padding: 4px 8px;
      font-size: 12px;
      cursor: pointer;
      margin-top: 5px;
      margin-bottom: 5px;
    }
    .tweet-extract-btn:hover {
      background-color: rgba(13, 23, 32, 255)
      
    }
    .fact-check-container {
      margin: 10px 0;
      padding: 16px;
      border-radius: 10px;
      background-color:rgb(0, 0, 0);
      border: 1px solid #2f3336;;
      display: none;
      animation: slideDown 0.3s ease-out;
    }
    .fact-check-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e6ecf0;
    }
    .fact-check-header h3 {
      margin: 0;
      color: #b2b1ff;
      font-size: 16px;
      font-weight: bold;
    }
    .fact-check-content {
      line-height: 1.5;
      color: rgb(239, 239, 239);
    }
    .fact-check-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 15px;
      color: rgb(239, 239, 239);
    }
    .fact-check-loading::after {
      content: "";
      display: inline-block;
      width: 20px;
      height: 20px;
      border: 3px solid #b2b1ff;
      border-top: 3px solid transparent;
      border-radius: 50%;
      margin-left: 10px;
      animation: spin 1s linear infinite;
      box-sizing: border-box;
}
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes slideDown {
      from { max-height: 0; opacity: 0; }
      to { max-height: 500px; opacity: 1; }
    }
  `;
  document.head.appendChild(style);

  const tweetElements = document.querySelectorAll('article');
  let buttonsAdded = 0;

  tweetElements.forEach((tweetElement) => {
    if (tweetElement.querySelector('.tweet-extract-btn')) {
      return;
    }

    let tweet_check_text = "";
    const tweetTextCheckElement = tweetElement.querySelector('[data-testid="tweetText"]');
    if (tweetTextCheckElement) {
      tweet_check_text = tweetTextCheckElement.innerText.trim();
    }

    if (!check_for_claim(tweet_check_text)) {
      return;
    }

    const button = document.createElement('button');
    button.className = 'tweet-extract-btn';

    const logo = document.createElement('img');
    logo.src = chrome.runtime.getURL('icons/icon48.png'); 
    logo.style.height = '23px'; 
    logo.style.width = 'auto';

    button.appendChild(logo);

    const factCheckContainer = document.createElement('div');
    factCheckContainer.className = 'fact-check-container';

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'fact-check-loading';
    loadingIndicator.textContent = 'Checking facts...';
    factCheckContainer.appendChild(loadingIndicator);

    button.addEventListener('click', async function (event) {
      event.preventDefault();
      event.stopPropagation();

      let tweetText = '';
      let tweetImageUrl = '';

      const usernameElement = tweetElement.querySelector('[data-testid="User-Name"]');
      let username = 'Unknown User';
      if (usernameElement) {
        username = usernameElement.innerText.split('\n')[0];
      }

      const tweetTextElement = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetTextElement) {
        tweetText = tweetTextElement.innerText.trim();
      }

      console.log(tweetText)
      
      const imageElement = tweetElement.querySelector('img[src*="twimg.com/media"], img[src*="pbs.twimg.com/media"], img[src*="abs.twimg.com/media"]');
      if (imageElement) {
        tweetImageUrl = imageElement.getAttribute('src');
      }

      console.log(tweetImageUrl)

      const formattedTweet = `${username}: ${tweetText} | ${tweetImageUrl}`;

      const isHidden = factCheckContainer.style.display === 'none' || !factCheckContainer.style.display;

      if (isHidden) {
        factCheckContainer.style.display = 'block';

        if (!factCheckContainer.querySelector('.fact-check-result')) {
          loadingIndicator.style.display = 'block';

          try {
            const factCheckResult = await sendToServerAndWait(formattedTweet);

            const formattedResult = factCheckResult
            .replace(/(Claim:)/g, '<strong><span style="color: #b2b1ff;">$1</span></strong>') 
            .replace(/(Verdict:)/g, '<br><strong><span style="color: #b2b1ff;">$1</span></strong>')  
            .replace(/(Reason:)/g, '<br><strong><span style="color: #b2b1ff;">$1</span></strong>')  


            const resultElement = document.createElement('div');
            resultElement.className = 'fact-check-result';
            resultElement.innerHTML = `
              <div class="fact-check-header">
                <h3>Fact Check</h3>
              </div>
              <div class="fact-check-content">${formattedResult}</div>
            `;

            loadingIndicator.style.display = 'none';
            factCheckContainer.appendChild(resultElement);
          } catch (error) {
            loadingIndicator.style.display = 'none';
            factCheckContainer.innerHTML = `
              <div style="color: #e0245e; padding: 10px;">
                Error fetching fact check: ${error.message}
              </div>
            `;
          }
        }
      } else {
        factCheckContainer.style.display = 'none';
      }
    });

    const actionBar = tweetElement.querySelector('[role="group"]');
    if (actionBar) {
      const buttonContainer = document.createElement('div');
      buttonContainer.style.marginLeft = '10px';
      buttonContainer.appendChild(button);
      actionBar.appendChild(buttonContainer);
      buttonsAdded++;

      const tweetContent = tweetElement.querySelector('[data-testid="tweetText"]');
      if (tweetContent) {
        const parentElement = tweetContent.closest('div[lang]');
        if (parentElement && parentElement.parentNode) {
          parentElement.parentNode.insertBefore(factCheckContainer, parentElement.nextSibling);
        } else {
          tweetElement.appendChild(factCheckContainer);
        }
      } else {
        tweetElement.appendChild(factCheckContainer);
      }
    }
  });

  return buttonsAdded;
}

function sendToServerAndWait(data) {
  let dataParts = data.split("|")
  if (dataParts[1] === undefined || dataParts[1] === "" || dataParts[1] === " ") {
    return new Promise((resolve, reject) => {
      console.log("Sending to server: ", dataParts[0].trim())
      fetch('http://127.0.0.1:5000/api/endpoint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        
        body: JSON.stringify({ 
          text: dataParts[0].trim(),
          imageUrl: "No Image"
         })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.json();
        })
        .then(result => {
          resolve(result.fact_check || "No fact check information available");
        })
        .catch(error => {``
          reject(error);
        });
    });
  }
  else {
    return new Promise((resolve, reject) => {
    fetch('http://127.0.0.1:5000/api/endpoint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      
      body: JSON.stringify({ 
        text: dataParts[0].trim(),
        imageUrl: dataParts[1].trim()
       })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(result => {
        resolve(result.fact_check || "No fact check information available");
      })
      .catch(error => {``
        reject(error);
      });
    });
  }
}

function check_for_claim(tweetText) {
  const claimIndicators = [
    /\b(is|are|was|were|has|have|had|will|can|could|should|must|may|might|did|does|do)\b/,

    /\b(according to|research|study|data|report|claims?|says|news|just in)\b/,

    /\b(true|false|real|fake|fact|hoax|myth)\b/,

    /\d{1,3}%/,   
    /\d{4}/,      
    /\$\d+/,
  ]

  return claimIndicators.some(pattern => pattern.test(tweetText.toLowerCase()))

}

addButtonsToTweets();

const observer = new MutationObserver(() => {
  setTimeout(() => {
    addButtonsToTweets();
  }, 300);
});
observer.observe(document.body, { childList: true, subtree: true });