document.addEventListener("DOMContentLoaded", () => {
  const postForm = document.getElementById("postForm");

  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;

    const userId = 1; // Replace with the actual user ID

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, content, userId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Innlegg publisert!");
        postForm.reset();
      } else {
        alert("Feil ved publisering: " + data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Noe gikk galt!");
    }
  });
});
