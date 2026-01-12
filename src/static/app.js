document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

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

  function renderParticipants(participants) {
    if (!participants || participants.length === 0) {
      return `<p class="info" style="padding:8px;border-radius:4px;">No participants yet</p>`;
    }
    const items = participants.map(p => `
      <li class="participant-item">
        <span class="participant-avatar" title="${p}">${initialsFromEmail(p)}</span>
        <span>${p}</span>
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
      const participantsHTML = renderParticipants(act.participants || []);

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
  fetchActivities();
});
