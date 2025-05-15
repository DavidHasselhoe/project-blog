async function loadPosts() {
  try {
    const response = await fetch("/api/posts");

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const posts = await response.json();

    if (!Array.isArray(posts)) {
      throw new Error("Invalid data format: posts is not an array");
    }

    renderPosts(posts);
  } catch (err) {
    console.error("Error loading posts:", err);
  }
}

function renderPosts(posts) {
  if (!Array.isArray(posts)) {
    posts = [];
  }
  const grid = document.getElementById("postGrid");
  grid.innerHTML = "";

  posts.forEach((post) => {
    const column = document.createElement("div");
    column.className = "col-12 col-md-6 col-lg-4";

    const card = document.createElement("a");
    card.href = `viewpost.html?postId=${post.Id}`;
    card.className = "text-decoration-none text-dark";
    card.innerHTML = `
      <div class="border p-2 h-100 d-flex flex-column">
        <div class="mb-2" style="height: 150px; background-color: #eee">
          IMAGE
        </div>
        <h5>${post.Title}</h5>
        <small class="text-muted">Published: ${new Date(
          post.CreatedAt
        ).toLocaleDateString("en-GB")}</small>
      </div>
    `;

    column.appendChild(card);
    grid.appendChild(column);
  });
}

loadPosts();

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("jwtToken");
  const loginStatus = document.getElementById("loginStatus");
  const logoutNav = document.getElementById("logoutNav");
  const logoutBtn = document.getElementById("logoutBtn");

  if (token) {
    loginStatus.innerHTML = `<span class="nav-link text-success">Logged in</span>`;
    logoutNav.style.display = "block";
  } else {
    loginStatus.innerHTML = `<a class="nav-link" href="/login">Log In</a>`;
    logoutNav.style.display = "none";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("jwtToken");
      window.location.reload();
    });
  }

  const searchInput = document.querySelector('input[type="search"]');
  if (searchInput) {
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value.trim();
      let posts = [];
      if (query === "") {
        posts = await fetchAllPosts();
      } else {
        const res = await fetch(
          `/api/posts/search?q=${encodeURIComponent(query)}`
        );
        posts = await res.json();
      }
      renderPosts(posts);
    });
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "n" && !e.target.matches("input, textarea")) {
    window.location.href = "blogpost.html";
  }
});

async function fetchAllPosts() {
  const res = await fetch("/api/posts");
  return await res.json();
}
