/* ==========================================================================
   JustBlog — frontend logic
   Vanilla JS, no build step. Talks to the Spring Boot API on the same origin.
   ========================================================================== */

(() => {
  "use strict";

  /* ---------------------------------------------------------------------
     State + auth helpers
     ------------------------------------------------------------------- */

  const state = {
    token: localStorage.getItem("jb_token") || null,
    userId: localStorage.getItem("jb_userId") || null,
    username: localStorage.getItem("jb_username") || null,
  };

  function isLoggedIn() {
    return Boolean(state.token);
  }

  function setAuth({ token, userId, username }) {
    state.token = token;
    state.userId = String(userId);
    state.username = username;
    localStorage.setItem("jb_token", token);
    localStorage.setItem("jb_userId", String(userId));
    localStorage.setItem("jb_username", username);
    updateAuthUI();
  }

  function clearAuth() {
    state.token = null;
    state.userId = null;
    state.username = null;
    localStorage.removeItem("jb_token");
    localStorage.removeItem("jb_userId");
    localStorage.removeItem("jb_username");
    updateAuthUI();
  }

  function updateAuthUI() {
    const out = document.querySelectorAll('[data-auth="out"]');
    const inn = document.querySelectorAll('[data-auth="in"]');
    out.forEach((el) => (el.hidden = isLoggedIn()));
    inn.forEach((el) => (el.hidden = !isLoggedIn()));
    const navUsername = document.getElementById("nav-username");
    if (navUsername && state.username) navUsername.textContent = state.username;
  }

  /* ---------------------------------------------------------------------
     Small utilities
     ------------------------------------------------------------------- */

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function formatDate(value) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  }

  function excerpt(content, max = 220) {
    const clean = String(content || "").trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
  }

  function paragraphs(content) {
    return escapeHtml(content)
      .split(/\n+/)
      .filter((p) => p.trim().length)
      .map((p) => `<p>${p}</p>`)
      .join("");
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80);
  }

  let toastTimer = null;
  function showToast(message, type = "info") {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.className = "toast is-visible" + (type === "error" ? " is-error" : type === "success" ? " is-success" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3600);
  }

  function friendlyStatusMessage(status, fallback) {
    switch (status) {
      case 400:
        return "That request wasn't quite right — please check the form and try again.";
      case 401:
        return "Please sign in to continue.";
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return "That couldn't be found — it may have been removed.";
      case 500:
        return fallback || "Something went wrong on our end. Please try again.";
      default:
        return fallback || "Something went wrong. Please try again.";
    }
  }

  /* ---------------------------------------------------------------------
     API helper
     ------------------------------------------------------------------- */

  async function api(path, { method = "GET", body, auth = false } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && state.token) headers.Authorization = "Bearer " + state.token;

    let res;
    try {
      res = await fetch(path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (networkErr) {
      throw new Error("Can't reach the server. Is it running?");
    }

    if (!res.ok) {
      if (auth && (res.status === 401 || res.status === 403)) {
        // Session is gone or invalid — clear it so the UI doesn't lie about being signed in.
        clearAuth();
      }
      const err = new Error(friendlyStatusMessage(res.status));
      err.status = res.status;
      throw err;
    }

    if (res.status === 204) return null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) return res.json();
    return res.text();
  }

  /* ---------------------------------------------------------------------
     Router
     ------------------------------------------------------------------- */

  const views = {
    home: document.getElementById("view-home"),
    post: document.getElementById("view-post"),
    login: document.getElementById("view-login"),
    register: document.getElementById("view-register"),
    compose: document.getElementById("view-compose"),
    profile: document.getElementById("view-profile"),
  };

  function showView(name) {
    Object.values(views).forEach((v) => (v.hidden = true));
    views[name].hidden = false;
    window.scrollTo(0, 0);
  }

  function navigate(hash) {
    if (location.hash === hash) {
      route();
    } else {
      location.hash = hash;
    }
  }

  function parseRoute() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0) return { name: "home" };
    if (parts[0] === "post" && parts[1]) return { name: "post", id: parts[1] };
    if (parts[0] === "edit" && parts[1]) return { name: "edit", id: parts[1] };
    if (parts[0] === "login") return { name: "login" };
    if (parts[0] === "register") return { name: "register" };
    if (parts[0] === "compose") return { name: "compose" };
    if (parts[0] === "profile") return { name: "profile" };
    return { name: "home" };
  }

  function requireAuth(message) {
    if (!isLoggedIn()) {
      showToast(message, "error");
      location.hash = "#/login";
      return false;
    }
    return true;
  }

  function route() {
    const r = parseRoute();
    if (r.name === "home") {
      showView("home");
      loadFeed();
    } else if (r.name === "post") {
      showView("post");
      loadPost(r.id);
    } else if (r.name === "login") {
      showView("login");
    } else if (r.name === "register") {
      showView("register");
    } else if (r.name === "compose") {
      if (!requireAuth("Please sign in to write a post.")) return;
      showView("compose");
      setupComposeForm(null);
    } else if (r.name === "edit") {
      if (!requireAuth("Please sign in to edit this post.")) return;
      showView("compose");
      setupComposeForm(r.id);
    } else if (r.name === "profile") {
      if (!requireAuth("Please sign in to view your profile.")) return;
      showView("profile");
      loadProfile();
    }
  }

  window.addEventListener("hashchange", route);

  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    clearAuth();
    showToast("Signed out.", "success");
    navigate("#/");
  });

  /* ---------------------------------------------------------------------
     Home / feed
     ------------------------------------------------------------------- */

  async function loadFeed() {
    const container = document.getElementById("feed-list");
    container.innerHTML = '<p class="loading-note">Loading stories…</p>';
    try {
      const blogs = await api("/api/blogs");
      if (!blogs || blogs.length === 0) {
        container.innerHTML = `
          <div class="state-note">
            <p>No stories yet — be the first to write one.</p>
            <a class="btn" href="#/${isLoggedIn() ? "compose" : "register"}">Write with us</a>
          </div>`;
        return;
      }
      container.innerHTML = blogs.map(feedItemHtml).join("");
    } catch (err) {
      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
    }
  }

  function feedItemHtml(blog) {
    const author = blog.author && blog.author.username ? blog.author.username : "Unknown";
    return `
      <article class="feed-item">
        <h2><a href="#/post/${blog.blogId}">${escapeHtml(blog.title)}</a></h2>
        <p class="feed-meta">By ${escapeHtml(author)} · ${escapeHtml(formatDate(blog.createdAt))}</p>
        <p class="feed-excerpt">${escapeHtml(excerpt(blog.content))} <a class="read-more" href="#/post/${blog.blogId}">Read more</a></p>
      </article>`;
  }

  /* ---------------------------------------------------------------------
     Article detail
     ------------------------------------------------------------------- */

  let currentPostId = null;

  async function loadPost(id) {
    currentPostId = id;
    const container = document.getElementById("post-content");
    container.innerHTML = '<p class="loading-note">Loading story…</p>';

    try {
      const blog = await api(`/api/blogs/${id}`);
      const [likeCount, comments, liked] = await Promise.all([
        api(`/api/likes/blog/${id}/count`).catch(() => 0),
        api(`/api/comments/blog/${id}`).catch(() => []),
        isLoggedIn()
          ? api(`/api/likes/user/${state.userId}/blog/${id}/status`).catch(() => false)
          : Promise.resolve(false),
      ]);

      const isOwner = isLoggedIn() && blog.author && String(blog.author.userId) === String(state.userId);
      const author = blog.author && blog.author.username ? blog.author.username : "Unknown";

      container.innerHTML = `
        <article>
          <div class="article-head">
            <p class="eyebrow"><a href="#/">← Back to stories</a></p>
            <h1>${escapeHtml(blog.title)}</h1>
            <div class="byline">
              <span>By <b>${escapeHtml(author)}</b></span>
              <span class="dot">·</span>
              <span>${escapeHtml(formatDate(blog.createdAt))}</span>
            </div>
            ${isOwner ? `
              <div class="article-actions">
                <a class="btn-text" href="#/edit/${blog.blogId}">Edit</a>
                <button class="btn-text" id="delete-post-btn" type="button">Delete</button>
              </div>` : ""}
          </div>

          <div class="article-body">${paragraphs(blog.content)}</div>

          <div class="article-foot">
            <button class="like-btn${liked ? " is-liked" : ""}" id="like-btn" type="button">
              <span class="heart">♥</span>
              <span id="like-count">${likeCount ?? 0}</span>
              <span>${liked ? "Liked" : "Like"}</span>
            </button>
          </div>

          <section class="comments-section">
            <h3>Comments</h3>
            <div id="comments-list"></div>
            ${isLoggedIn() ? `
              <form id="comment-form">
                <div class="field">
                  <label for="comment-content">Add a comment</label>
                  <textarea id="comment-content" style="min-height:90px;" required></textarea>
                </div>
                <button class="btn btn-small" type="submit">Post comment</button>
              </form>` : `
              <p class="empty-comments"><a href="#/login">Sign in</a> to join the conversation.</p>`}
          </section>
        </article>`;

      renderComments(comments);

      document.getElementById("like-btn").addEventListener("click", () => toggleLike(id));

      if (isOwner) {
        document.getElementById("delete-post-btn").addEventListener("click", () => deletePost(id));
      }

      const commentForm = document.getElementById("comment-form");
      if (commentForm) {
        commentForm.addEventListener("submit", (e) => submitComment(e, id));
      }
    } catch (err) {
      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
    }
  }

  function renderComments(comments) {
    const list = document.getElementById("comments-list");
    if (!comments || comments.length === 0) {
      list.innerHTML = '<p class="empty-comments">No comments yet — be the first to say something.</p>';
      return;
    }
    list.innerHTML = comments
      .map((c) => {
        const owner = isLoggedIn() && c.user && String(c.user.userId) === String(state.userId);
        const authorName = c.user && c.user.username ? c.user.username : "Unknown";
        return `
          <div class="comment" data-comment-id="${c.commentId}">
            ${owner ? `<button class="comment-delete" data-delete-comment="${c.commentId}" title="Delete comment">×</button>` : ""}
            <div class="comment-head">
              <span class="comment-author">${escapeHtml(authorName)}</span>
              <span class="comment-date">${escapeHtml(formatDate(c.createdAt))}</span>
            </div>
            <p class="comment-body">${escapeHtml(c.content)}</p>
          </div>`;
      })
      .join("");

    list.querySelectorAll("[data-delete-comment]").forEach((btn) => {
      btn.addEventListener("click", () => deleteComment(btn.getAttribute("data-delete-comment")));
    });
  }

  async function toggleLike(blogId) {
    if (!isLoggedIn()) {
      showToast("Please sign in to like a story.", "error");
      navigate("#/login");
      return;
    }
    const btn = document.getElementById("like-btn");
    btn.disabled = true;
    try {
      await api(`/api/likes/user/${state.userId}/blog/${blogId}`, { method: "POST", auth: true });
      const count = await api(`/api/likes/blog/${blogId}/count`).catch(() => null);
      const nowLiked = btn.classList.toggle("is-liked");
      btn.querySelector("span:last-child").textContent = nowLiked ? "Liked" : "Like";
      if (count !== null) document.getElementById("like-count").textContent = count;
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function submitComment(e, blogId) {
    e.preventDefault();
    const textarea = document.getElementById("comment-content");
    const content = textarea.value.trim();
    if (!content) return;
    const submitBtn = e.target.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    try {
      await api(`/api/comments/user/${state.userId}/blog/${blogId}`, {
        method: "POST",
        auth: true,
        body: { content },
      });
      textarea.value = "";
      const comments = await api(`/api/comments/blog/${blogId}`);
      renderComments(comments);
      showToast("Comment posted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function deleteComment(commentId) {
    if (!confirm("Delete this comment?")) return;
    try {
      await api(`/api/comments/${commentId}`, { method: "DELETE", auth: true });
      const comments = await api(`/api/comments/blog/${currentPostId}`);
      renderComments(comments);
      showToast("Comment deleted.", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function deletePost(blogId) {
    if (!confirm("Delete this story? This can't be undone.")) return;
    try {
      await api(`/api/blogs/${blogId}`, { method: "DELETE", auth: true });
      showToast("Story deleted.", "success");
      navigate("#/");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  /* ---------------------------------------------------------------------
     Login
     ------------------------------------------------------------------- */

  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("login-error");
    errorEl.hidden = true;
    const submitBtn = document.getElementById("login-submit");
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    submitBtn.disabled = true;
    try {
      const res = await api("/api/auth/login", { method: "POST", body: { username, password } });
      setAuth(res);
      e.target.reset();
      showToast(`Welcome back, ${res.username}.`, "success");
      navigate("#/");
    } catch (err) {
      const msg = err.status === 500 || err.status === 401 || err.status === 403
        ? "Invalid username or password."
        : err.message;
      errorEl.textContent = msg;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------
     Register
     ------------------------------------------------------------------- */

  document.getElementById("register-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("register-error");
    errorEl.hidden = true;
    const submitBtn = document.getElementById("register-submit");
    const username = document.getElementById("register-username").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;

    submitBtn.disabled = true;
    try {
      const res = await api("/api/auth/register", { method: "POST", body: { username, email, password } });
      setAuth(res);
      e.target.reset();
      showToast(`Welcome, ${res.username}! Your account is ready.`, "success");
      navigate("#/");
    } catch (err) {
      const msg = err.status === 500
        ? "That username or email may already be taken — try another."
        : err.message;
      errorEl.textContent = msg;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------
     Compose / edit
     ------------------------------------------------------------------- */

  let composeEditingId = null;
  let slugTouched = false;

  function setupComposeForm(editId) {
    composeEditingId = editId;
    slugTouched = false;
    const form = document.getElementById("compose-form");
    const errorEl = document.getElementById("compose-error");
    errorEl.hidden = true;
    form.reset();

    document.getElementById("compose-eyebrow").textContent = editId ? "Edit story" : "New story";
    document.getElementById("compose-heading").textContent = editId ? "Edit your story" : "Write something";
    document.getElementById("compose-submit").textContent = editId ? "Save changes" : "Publish";

    if (editId) {
      document.getElementById("compose-title").disabled = true;
      document.getElementById("compose-slug").disabled = true;
      document.getElementById("compose-content").disabled = true;
      api(`/api/blogs/${editId}`)
        .then((blog) => {
          document.getElementById("compose-title").value = blog.title || "";
          document.getElementById("compose-slug").value = blog.slug || "";
          document.getElementById("compose-content").value = blog.content || "";
        })
        .catch((err) => {
          errorEl.textContent = err.message;
          errorEl.hidden = false;
        })
        .finally(() => {
          document.getElementById("compose-title").disabled = false;
          document.getElementById("compose-slug").disabled = false;
          document.getElementById("compose-content").disabled = false;
        });
    }
  }

  document.getElementById("compose-slug").addEventListener("input", () => {
    slugTouched = true;
  });

  document.getElementById("compose-title").addEventListener("input", (e) => {
    if (!slugTouched) {
      document.getElementById("compose-slug").value = slugify(e.target.value);
    }
  });

  document.getElementById("compose-cancel").addEventListener("click", () => {
    history.back();
  });

  document.getElementById("compose-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("compose-error");
    errorEl.hidden = true;
    const submitBtn = document.getElementById("compose-submit");

    const title = document.getElementById("compose-title").value.trim();
    const content = document.getElementById("compose-content").value.trim();
    let slug = document.getElementById("compose-slug").value.trim();
    if (!slug) slug = slugify(title);

    submitBtn.disabled = true;
    try {
      let blog;
      if (composeEditingId) {
        blog = await api(`/api/blogs/${composeEditingId}`, {
          method: "PUT",
          auth: true,
          body: { title, content, slug },
        });
        showToast("Story updated.", "success");
      } else {
        blog = await api(`/api/blogs/author/${state.userId}`, {
          method: "POST",
          auth: true,
          body: { title, content, slug },
        });
        showToast("Story published.", "success");
      }
      navigate(`#/post/${blog.blogId}`);
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------------
     Profile
     ------------------------------------------------------------------- */

  async function loadProfile() {
    const container = document.getElementById("profile-content");
    container.innerHTML = '<p class="loading-note">Loading profile…</p>';
    try {
      const [user, blogs] = await Promise.all([
        api(`/api/users/${state.userId}`, { auth: true }),
        api(`/api/blogs/author/${state.userId}`).catch(() => []),
      ]);

      container.innerHTML = `
        <div class="profile-card">
          <h2 class="profile-name">${escapeHtml(user.username)}</h2>
          <p class="profile-email">${escapeHtml(user.email)}</p>
          <form id="bio-form">
            <div class="field">
              <label for="bio-input">Bio</label>
              <textarea id="bio-input" style="min-height:110px;">${escapeHtml(user.bio || "")}</textarea>
            </div>
            <button class="btn btn-small" type="submit">Save bio</button>
          </form>
        </div>
        <h3 style="font-family:var(--font-display); font-weight:600; margin-bottom:14px;">Your stories</h3>
        <div class="feed-list" id="profile-feed">
          ${blogs.length ? blogs.map(feedItemHtml).join("") : '<p class="state-note">You haven\'t written anything yet.</p>'}
        </div>`;

      document.getElementById("bio-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        const bio = document.getElementById("bio-input").value;
        try {
          await api(`/api/users/${state.userId}`, {
            method: "PUT",
            auth: true,
            body: { bio },
          });
          showToast("Bio updated.", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    } catch (err) {
      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
    }
  }

  /* ---------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------- */

  updateAuthUI();
  route();
})();