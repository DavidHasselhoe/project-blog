document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("postId");

  if (!postId || postId === "null") {
    alert("No post selected.");
    return;
  }

  const res = await fetch(`/api/posts/${postId}`);
  const post = await res.json();

  document.getElementById("postTitle").textContent = post.Title;
  document.getElementById("postBody").textContent = post.Content;

  const token = localStorage.getItem("jwtToken");
  let userId = null;
  if (token) {
    const payload = JSON.parse(atob(token.split(".")[1]));
    userId = payload.userId;
  }

  console.log("post.UserId:", post.UserId, "userId:", userId);

  if (userId && String(post.UserId) === String(userId)) {
    document.getElementById("editBtn").style.display = "inline-block";
    document.getElementById("deleteBtn").style.display = "inline-block";
  }

  document.getElementById("editBtn").addEventListener("click", () => {
    document.getElementById("editForm").style.display = "block";
    document.getElementById("editTitle").value = post.Title;
    document.getElementById("editContent").value = post.Content;
  });

  document.getElementById("cancelEdit").addEventListener("click", () => {
    document.getElementById("editForm").style.display = "none";
  });

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const newTitle = document.getElementById("editTitle").value;
    const newContent = document.getElementById("editContent").value;
    const editRes = await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    const editData = await editRes.json();
    if (editRes.ok) {
      document.getElementById("postTitle").textContent = newTitle;
      document.getElementById("postBody").textContent = newContent;
      document.getElementById("editForm").style.display = "none";
      alert("Post updated!");
    } else {
      alert(editData.message || "Could not update post.");
    }
  });

  document.getElementById("deleteBtn").addEventListener("click", async () => {
    if (
      confirm(
        "Are you sure you want to delete this post? This action cannot be undone."
      )
    ) {
      const token = localStorage.getItem("jwtToken");
      const res = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert("Post deleted!");
        window.location.href = "index.html";
      } else {
        alert(data.message || "Could not delete post.");
      }
    }
  });

  async function updateLikeState() {
    const token = localStorage.getItem("jwtToken");
    if (!token) return;

    const res = await fetch(`/api/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    document.getElementById("likeCount").textContent = data.likeCount;
    document.getElementById("likeIcon").textContent = data.likedByUser
      ? "♥"
      : "♡";
  }

  document.getElementById("likeBtn").addEventListener("click", async () => {
    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("You must be logged in to like posts.");
      return;
    }

    const liked = document.getElementById("likeIcon").textContent === "♥";
    const method = liked ? "DELETE" : "POST";
    const res = await fetch(`/api/posts/${postId}/like`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    await updateLikeState();
  });

  updateLikeState();
});
