document.addEventListener("DOMContentLoaded", () => {
  const postForm = document.getElementById("postForm");

  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("jwtToken");
    if (!token) {
      alert("You must be logged in to create a post.");
      window.location.href = "/login";
      return;
    }

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Post published!");
        postForm.reset();
      } else {
        alert("Error publishing post: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong!");
    }
  });
});
