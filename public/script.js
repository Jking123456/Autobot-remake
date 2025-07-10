document.getElementById('agreeCheckbox').addEventListener('change', function () {
  document.getElementById('submitButton').disabled = !this.checked;
});

let Commands = [{
  'commands': []
}, {
  'handleEvent': []
}];

function showAds() {
  var ads = [
    '',
    ''
  ];
  var index = Math.floor(Math.random() * ads.length);
}

function measurePing() {
  var xhr = new XMLHttpRequest();
  var startTime, endTime;
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      endTime = Date.now();
      var pingTime = endTime - startTime;
      document.getElementById("ping").textContent = pingTime + " ms";
    }
  };
  xhr.open("GET", location.href + "?t=" + new Date().getTime());
  startTime = Date.now();
  xhr.send();
}
setInterval(measurePing, 1000);

function updateTime() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Manila',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  const formattedTime = now.toLocaleString('en-US', options);
  document.getElementById('time').textContent = formattedTime;
}
updateTime();
setInterval(updateTime, 1000);

async function State() {
  const jsonInput = document.getElementById('json-data');
  const button = document.getElementById('submitButton');
  if (!Commands[0].commands.length) {
    return showResult('Please provide at least one valid command for execution.');
  }
  try {
    button.style.display = 'none';
    const State = JSON.parse(jsonInput.value);
    if (State && typeof State === 'object') {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: State,
          commands: Commands,
          prefix: document.getElementById('inputOfPrefix').value,
          admin: document.getElementById('inputOfAdmin').value,
        }),
      });
      const data = await response.json();
      jsonInput.value = '';
      showResult(data.message);
      showAds();
    } else {
      jsonInput.value = '';
      showResult('Invalid JSON data. Please check your input.');
      showAds();
    }
  } catch (parseError) {
    jsonInput.value = '';
    console.error('Error parsing JSON:', parseError);
    showResult('Error parsing JSON. Please check your input.');
    showAds();
  } finally {
    setTimeout(() => {
      button.style.display = 'block';
    }, 4000);
  }
}

function showResult(message) {
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = `<h5>${message}</h5>`;
  resultContainer.style.display = 'block';
}

async function commandList() {
  try {
    const [listOfCommands, listOfCommandsEvent] = [
      document.getElementById('listOfCommands'),
      document.getElementById('listOfCommandsEvent')
    ];

    const response = await fetch('/commands');
    const { commands, handleEvent, aliases } = await response.json();

    [commands, handleEvent].forEach((commandList, i) => {
      commandList.forEach((command, index) => {
        const container = createCommand(
          i === 0 ? listOfCommands : listOfCommandsEvent,
          index + 1,
          command,
          i === 0 ? 'commands' : 'handleEvent',
          aliases[index] || []
        );
        (i === 0 ? listOfCommands : listOfCommandsEvent).appendChild(container);
      });
    });

  } catch (error) {
    console.log(error);
  }
}

function createCommand(element, order, command, type, aliases) {
  const container = document.createElement('div');
  container.classList.add('py-1');

  const label = document.createElement('span');
  label.classList.add('text-white', 'd-block');
  label.textContent = `${order}. ${command}`;

  container.appendChild(label);

  // Auto-add command/event to the array
  if (type === 'commands' && !Commands[0].commands.includes(command)) {
    Commands[0].commands.push(command);
  } else if (type === 'handleEvent' && !Commands[1].handleEvent.includes(command)) {
    Commands[1].handleEvent.push(command);
  }

  return container;
}

// Load commands on page load
commandList();
