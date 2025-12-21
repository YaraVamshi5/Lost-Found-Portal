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

/* ---------- Entery ---------- */
function showEntry() {
  body.innerHTML = `
    <div class="user-icon">👤</div>
    <button class="primary-btn" onclick="showSignup()">Signup</button>
    <button class="primary-btn secondary" onclick="showLogin()">Login</button>
  `;
}

/* ---------- SignUp ---------- */
function showSignup() {
  body.innerHTML = `
    <h2>Create Account</h2>
    <input id="name" placeholder="Full Name" />
    <input id="email" placeholder="Email" />
    <input id="mobile" placeholder="Mobile Number" />
    <input id="password" type="password" placeholder="Password" />
    <input id="confirm" type="password" placeholder="Confirm Password" />
    <button class="primary-btn" onclick="signup()">Create Account</button>
  `;
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

  const res = await fetch("http://localhost:3000/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, mobile, password })
  });

  const data = await res.json();

  if (res.ok) {
    showToast("Account created successfully", "success");
    showLogin();
  } else {
    showToast(` ${data.message}`, "error");
  }
}

/* ---------- logIn ---------- */
function showLogin() {
  body.innerHTML = `
    <h2>Login</h2>
    <input id="email" placeholder="Email" />
    <input id="password" type="password" placeholder="Password" />
    <button class="primary-btn" onclick="login()">Login</button>
  `;
  
}

async function login() {
  const email = val("email");
  const password = val("password");

  if (!email || !password)
    return showToast("Email and password required", "error");

  const res = await fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok)
    return showToast(` ${data.message}`, "error");

  localStorage.setItem("userId", data.user.id);
  closeUserModal();
  showToast(" Login successful", "success");
}

/* ---------- load user profile ---------- */
async function loadUserProfile(userId) {
  try {
    const res = await fetch(`http://localhost:3000/api/user/${userId}`);
    const user = await res.json();

    if (!res.ok) throw new Error();
    showProfile(user);
  } catch {
    showEntry();
    showToast(" Failed to load profile", "error");
  }
}

/* ---------- profile ---------- */
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

/* ---------- logout ---------- */
function logout() {
  localStorage.removeItem("userId");
  showEntry();
  showToast("Logged out successfully", "success");
}

/* ---------- toast ---------- */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

/* ---------- helper ---------- */
function val(id) {
  return document.getElementById(id)?.value.trim();
}
