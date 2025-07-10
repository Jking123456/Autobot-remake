let Commands = [{ commands: [] }, { handleEvent: [] }];

document.addEventListener('DOMContentLoaded', () => {
  commandList();
  updateTime();
  setInterval(updateTime, 1000);
  setInterval(measurePing, 1000);
  document.getElementById('submitButton').addEventListener('click', State);

  document.getElementById('openDivBtn').addEventListener('click', () => {
    document.getElementById('floatingDiv').style.display = 'block';
    listOfAi();
  });

  document.getElementById('closeDivBtn').addEventListener('click', () => {
    document.getElementById('floatingDiv').style.display = 'none';
  });
});

function showResult(message) {
  const resultContainer = document.getElementById('result');
  resultContainer.innerHTML = `<h5>${message}</h5>`;
  resultContainer.style.display = 'block';
}

function measurePing() {
  const xhr = new XMLHttpRequest();
  let startTime, endTime;
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      endTime = Date.now();
      document.getElementById("ping").textContent = `${endTime - startTime} ms`;
    }
  };
  xhr.open("GET", location.href + "?t=" + new Date().getTime());
  startTime = Date.now();
  xhr.send();
}

function updateTime() {
  const now = new Date();
  const options = {
    timeZone: 'Asia/Manila',
    hour12: true,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  document.getElementById('time').textContent = now.toLocaleString('en-US', options);
}

async function State() {
  const jsonInput = document.getElementById('json-data');
  const button = document.getElementById('submitButton');

  if (!Commands[0].commands.length) {
    return showResult('Please provide at least one valid command for execution.');
  }

  try {
    button.style.display = 'none';
    const State = JSON.parse(jsonInput.value);

    const payload = {
      state: State,
      commands: Commands,
      prefix: document.getElementById('inputOfPrefix').value,
      admin: document.getElementById('inputOfAdmin').value
    };

    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    jsonInput.value = '';
    showResult(data.message || 'Bot initialized.');
  } catch (err) {
    console.error('Login error:', err);
    showResult('Invalid JSON or login error.');
  } finally {
    setTimeout(() => { button.style.display = 'block'; }, 4000);
  }
}

async function commandList() {
  try {
    const listOfCommands = document.getElementById('listOfCommands');
    const listOfCommandsEvent = document.getElementById('listOfCommandsEvent');
    const response = await fetch('/commands');
    const { commands, handleEvent, aliases } = await response.json();

    [commands, handleEvent].forEach((cmdList, i) => {
      cmdList.forEach((cmd, index) => {
        const container = createCommand(
          i === 0 ? listOfCommands : listOfCommandsEvent,
          index + 1,
          cmd,
          i === 0 ? 'commands' : 'handleEvent',
          aliases[index] || []
        );
        (i === 0 ? listOfCommands : listOfCommandsEvent).appendChild(container);
      });
    });

    document.getElementById('submitButton').disabled = false;
  } catch (error) {
    console.error('Error loading commands:', error);
  }
}

function createCommand(container, order, command, type, aliases) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('form-check', 'form-switch');
  wrapper.onclick = toggleCheckbox;

  const input = document.createElement('input');
  input.className = `form-check-input ${type}`;
  input.type = 'checkbox';
  input.id = `command_${order}`;

  const label = document.createElement('label');
  label.className = `form-check-label ${type}`;
  label.htmlFor = input.id;
  label.textContent = `${order}. ${command}`;

  wrapper.appendChild(input);
  wrapper.appendChild(label);
  container.appendChild(wrapper);
  return wrapper;
}

function toggleCheckbox() {
  const configs = [
    { input: '.form-check-input.commands', label: '.form-check-label.commands', array: Commands[0].commands },
    { input: '.form-check-input.handleEvent', label: '.form-check-label.handleEvent', array: Commands[1].handleEvent }
  ];

  configs.forEach(({ input, label, array }) => {
    const checkbox = this.querySelector(input);
    const labelText = this.querySelector(label);
    if (!checkbox) return;

    checkbox.checked = !checkbox.checked;
    const cmd = labelText.textContent.replace(/^\d+\.\s/, '').split(" ")[0];

    if (checkbox.checked) {
      labelText.classList.add('disable');
      if (!array.includes(cmd)) array.push(cmd);
    } else {
      labelText.classList.remove('disable');
      const index = array.indexOf(cmd);
      if (index !== -1) array.splice(index, 1);
    }
  });
}

function listOfAi() {
  const userOnline = document.getElementById("user_online");
  fetch("/info")
    .then(response => response.json())
    .then(data => {
      userOnline.innerHTML = '';
      data.forEach(user => {
        const { name, thumbSrc, profileUrl, time } = user;

        const card = document.createElement('div');
        card.className = 'col-12 user-card mb-4';

        const img = document.createElement('img');
        img.src = thumbSrc;
        img.className = 'img-thumbnail';

        const info = document.createElement('div');
        info.className = 'user-info';

        const title = document.createElement('h4');
        title.textContent = name;

        const link = document.createElement('p');
        link.innerHTML = profileUrl;

        const uptime = document.createElement('p');
        uptime.className = 'uptime-user';
        uptime.innerHTML = `Uptime: ${timeFormat(time)}`;

        info.appendChild(title);
        info.appendChild(link);
        info.appendChild(uptime);
        card.appendChild(img);
        card.appendChild(info);
        userOnline.appendChild(card);

        setInterval(() => {
          user.time++;
          updateTimer(card, user.time);
        }, 1000);
      });
    })
    .catch(error => {
      userOnline.innerHTML = `<div class="alert alert-danger" role="alert">Error fetching session data.</div>`;
    });
}

function updateTimer(userCard, currentTime) {
  const uptimeUser = userCard.querySelector('.uptime-user');
  uptimeUser.textContent = `Uptime: ${timeFormat(currentTime)}`;
}

function timeFormat(time) {
  const days = Math.floor(time / 86400);
  const hours = Math.floor((time % 86400) / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = time % 60;

  let result = '';
  if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
  if (hours > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
  if (minutes > 0) result += `${minutes} minute${minutes > 1 ? 's' : ''} `;
  result += `${seconds} second${seconds !== 1 ? 's' : ''}`;
  return result.trim();
      }
