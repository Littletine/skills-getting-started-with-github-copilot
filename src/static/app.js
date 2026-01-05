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

      // Clear loading message and reset activity select
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

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

        // Render participants
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";
        const heading = document.createElement("h5");
        heading.textContent = "Participants";
        participantsDiv.appendChild(heading);

        if (!details.participants || details.participants.length === 0) {
          const empty = document.createElement("p");
          empty.className = "empty";
          empty.textContent = "No participants yet.";
          participantsDiv.appendChild(empty);
        } else {
          const ul = document.createElement("ul");
          details.participants.forEach((email) => {
            const li = document.createElement("li");
            li.className = "participant";

            const avatar = document.createElement("div");
            avatar.className = "avatar";
            avatar.textContent = email.charAt(0).toUpperCase();

            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = email;

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "delete-icon";
            deleteBtn.setAttribute("data-activity", name);
            deleteBtn.setAttribute("data-email", email);
            deleteBtn.setAttribute("aria-label", `Remove ${email} from ${name}`);
            deleteBtn.textContent = "🗑️";

            li.appendChild(avatar);
            li.appendChild(nameSpan);
            li.appendChild(deleteBtn);
            ul.appendChild(li);
          });
          participantsDiv.appendChild(ul);
        }

        activityCard.appendChild(participantsDiv);
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

  // Handle delete button clicks (delegated)
  activitiesList.addEventListener("click", async (event) => {
    if (!event.target.classList.contains("delete-icon")) return;

    const activityName = event.target.getAttribute("data-activity");
    const email = event.target.getAttribute("data-email");

    try {
      const res = await fetch(
        `/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        messageDiv.textContent = data.message || "Participant removed";
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        fetchActivities();
      } else {
        messageDiv.textContent = data.detail || "Failed to remove participant";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }
    } catch (err) {
      messageDiv.textContent = "Failed to remove participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error removing participant:", err);
    }

    setTimeout(() => messageDiv.classList.add("hidden"), 4000);
  });

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
        // Refresh activities immediately so the UI reflects the new participant
        fetchActivities();
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

  // Initialize app
  fetchActivities();
});
