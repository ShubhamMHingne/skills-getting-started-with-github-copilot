document.addEventListener("DOMContentLoaded", () => {






  // Fetch activities, render cards (including participants list), populate select, handle signup

  const activitiesListEl = document.getElementById('activities-list');
  const activitySelect = document.getElementById('activity');
  const form = document.getElementById('signup-form');
  const messageEl = document.getElementById('message');

  function showMessage(text, type = 'info') {
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
    messageEl.classList.remove('hidden');
    setTimeout(() => messageEl.classList.add('hidden'), 4000);
  }

  async function fetchActivities() {
    const res = await fetch('/activities');
    if (!res.ok) throw new Error('Failed to load activities');
    return res.json();
  }

  function initialsFromEmail(email) {
    // use local-part initials (before @) for avatar
    const local = email.split('@')[0];
    const parts = local.split(/[\.\-_]/).filter(Boolean);
    if (parts.length === 0) return local.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function renderParticipants(participants, activityName) {
    if (!participants || participants.length === 0) {
      return `<p class="info" style="padding:8px;border-radius:4px;">No participants yet</p>`;
    }
    const items = participants.map(p => `
      <li class="participant-item">
        <span class="participant-avatar" title="${p}">${initialsFromEmail(p)}</span>
        <span class="participant-email">${p}</span>
        <button class="unregister-btn" data-activity="${activityName}" data-email="${p}" title="Unregister">🗑️</button>
      </li>
    `).join('');
    return `<ul class="participants-list">${items}</ul>`;
  }

  function renderActivities(activities) {
    activitiesListEl.innerHTML = '';

    const entries = Object.entries(activities).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([key, act]) => {
      const name = (act && act.name) ? act.name : key;
      const description = act.description ? `<p>${act.description}</p>` : '';
      const schedule = act.schedule ? `<p><strong>Schedule:</strong> ${act.schedule}</p>` : '';
      const participantsHTML = renderParticipants(act.participants || [], key);

      const card = document.createElement('div');
      card.className = 'activity-card';
      card.innerHTML = `
        <h4>${name}</h4>
        ${description}
        ${schedule}
        <div class="participants-section">
          <h5>Participants (${(act.participants || []).length})</h5>
          ${participantsHTML}
        </div>
      `;
      activitiesListEl.appendChild(card);

      // wire up unregister buttons inside this card
      card.querySelectorAll('.unregister-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const activity = btn.dataset.activity;
          const email = btn.dataset.email;
          await unregisterParticipant(activity, email);
        });
      });
    });
  }

  function populateSelect(activities) {
    // clear existing options except placeholder
    const placeholder = activitySelect.querySelector('option[value=""]');
    activitySelect.innerHTML = '';
    if (placeholder) activitySelect.appendChild(placeholder);
    const entries = Object.entries(activities).sort(([a], [b]) => a.localeCompare(b));
    entries.forEach(([key, act]) => {
      const name = (act && act.name) ? act.name : key;
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  async function load() {
    try {
      const activities = await fetchActivities();
      renderActivities(activities);
      populateSelect(activities);
    } catch (err) {
      activitiesListEl.innerHTML = `<p class="error">Unable to load activities. Try again later.</p>`;
    }
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const res = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || 'Unregister failed');
      }
      showMessage(`Unregistered ${email} from ${activityName}`, 'success');
      await load();
    } catch (err) {
      console.error(err);
      showMessage(err.message || 'Failed to unregister participant', 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const activity = activitySelect.value;
    if (!activity) {
      showMessage('Please choose an activity.', 'error');
      return;
    }
    if (!email) {
      showMessage('Please enter an email.', 'error');
      return;
    }
    try {
      const res = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      const body = await res.json();
      if (!res.ok) {
        throw body;
      }
      showMessage(body.message || 'Signed up successfully!', 'success');
      document.getElementById('email').value = '';
      await load();
    } catch (err) {
      showMessage(err.detail || (err.message || 'Signup failed'), 'error');
    }
  });

  // Initialize app
  load();
});
