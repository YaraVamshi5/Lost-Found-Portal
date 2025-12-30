/* ---------- CONFIG ---------- */
const API_BASE_URL = "https://lost-found-portal-mx9e.onrender.com";

/* ---------- modal refs ---------- */
const modal = document.getElementById("userModal");
const body = document.querySelector(".modal-body");

/* ---------- open / close ---------- */
function openUserModal() {
  modal.style.display = "flex";

  const userId = localStorage.getItem("userId");
  if (userId) {
    loadUserProfile(userId);
  } else {
    showEntry();
  }
}

function closeUserModal() {
  modal.style.display = "none";
}

/* ---------- Entry ---------- */
function showEntry() {
  body.innerHTML = `
    <div class="user-icon">👤</div>
    <button class="primary-btn" onclick="showSignup()">Signup</button>
    <button class="primary-btn secondary" onclick="showLogin()">Login</button>
  `;
}

/* ---------- Signup ---------- */
function showSignup() {
  body.innerHTML = `
    <h2>Create Account</h2>

    <!-- autofill blocker -->
    <input type="text" style="display:none">
    <input type="password" style="display:none">

    <input id="name" placeholder="Full Name" autocomplete="off" />
    <input id="email" placeholder="Email" autocomplete="off" />
    <input id="mobile" placeholder="Mobile Number" autocomplete="off" />
    <input id="password" type="password" placeholder="Password" autocomplete="new-password" />
    <input id="confirm" type="password" placeholder="Confirm Password" autocomplete="new-password" />

    <button class="primary-btn" onclick="signup()">Create Account</button>
  `;

  clearAuthInputs();
}

async function signup() {
  const name = val("name");
  const email = val("email");
  const mobile = val("mobile");
  const password = val("password");
  const confirm = val("confirm");

  if (!name || !email || !mobile || !password || !confirm)
    return showToast("Please fill all fields", "error");

  if (!/^\d{10}$/.test(mobile))
    return showToast("Mobile number must be 10 digits", "error");

  if (password.length < 6)
    return showToast("Password must be at least 6 characters", "error");

  if (password !== confirm)
    return showToast("Passwords not matched", "error");

  try {
    const res = await fetch(`${API_BASE_URL}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, mobile, password })
    });

    const data = await res.json();

    if (!res.ok)
      return showToast(data.message || "Signup failed", "error");

    showToast("Account created successfully", "success");
    showLogin();
  } catch {
    showToast("Server not reachable", "error");
  }
}

/* ---------- Login ---------- */
function showLogin() {
  body.innerHTML = `
    <h2>Login</h2>

    <!-- autofill blocker -->
    <input type="text" style="display:none">
    <input type="password" style="display:none">

    <input id="email" placeholder="Email" autocomplete="off" />
    <input id="password" type="password" placeholder="Password" autocomplete="off" />

    <button class="primary-btn" onclick="login()">Login</button>
  `;

  clearAuthInputs();
}

async function login() {
  const email = val("email");
  const password = val("password");

  if (!email || !password)
    return showToast("Email and password required", "error");

  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok)
      return showToast(data.message || "Login failed", "error");

    localStorage.setItem("userId", data.user.id);
    closeUserModal();
    showToast("Login successful", "success");
  } catch {
    showToast("Server not reachable", "error");
  }
}

/* ---------- Load profile ---------- */
async function loadUserProfile(userId) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/${userId}`);
    const user = await res.json();

    if (!res.ok) throw new Error();
    showProfile(user);
  } catch {
    localStorage.removeItem("userId");
    showEntry();
    showToast("Failed to load profile", "error");
  }
}

/* ---------- Profile ---------- */
function showProfile(user) {
  body.innerHTML = `
    <div class="user-icon">👤</div>

    <div class="profile">
      <p><b>Name:</b> ${user.name}</p>
      <p><b>Email:</b> ${user.email}</p>
      <p><b>Mobile:</b> ${user.mobile}</p>

      <p><b>Lost Items:</b> ${user.lostCount}</p>
      <p><b>Found Items:</b> ${user.foundCount}</p>
      <p><b>Returned Items:</b> ${user.returnedCount}</p>
    </div>

    <button class="primary-btn" onclick="logout()">Logout</button>
  `;
}

/* ---------- Logout ---------- */
function logout() {
  localStorage.removeItem("userId");
  showEntry();
  showToast("Logged out successfully", "success");
}

/* ---------- Toast ---------- */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

/* ---------- Helpers ---------- */
function val(id) {
  return document.getElementById(id)?.value.trim();
}

function clearAuthInputs() {
  setTimeout(() => {
    const inputs = body.querySelectorAll("input");
    inputs.forEach(input => input.value = "");
  }, 0);
}
