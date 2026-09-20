///* ==========================================================================
//   JustBlog — frontend logic
//   Vanilla JS, no build step. Talks to the Spring Boot API on the same origin.
//   ========================================================================== */
//
//(() => {
//  "use strict";
//
//  /* ---------------------------------------------------------------------
//     State + auth helpers
//     ------------------------------------------------------------------- */
//
//  const state = {
//    token: localStorage.getItem("jb_token") || null,
//    userId: localStorage.getItem("jb_userId") || null,
//    username: localStorage.getItem("jb_username") || null,
//  };
//
//  function isLoggedIn() {
//    return Boolean(state.token);
//  }
//
//  function setAuth({ token, userId, username }) {
//    state.token = token;
//    state.userId = String(userId);
//    state.username = username;
//    localStorage.setItem("jb_token", token);
//    localStorage.setItem("jb_userId", String(userId));
//    localStorage.setItem("jb_username", username);
//    updateAuthUI();
//  }
//
//  function clearAuth() {
//    state.token = null;
//    state.userId = null;
//    state.username = null;
//    localStorage.removeItem("jb_token");
//    localStorage.removeItem("jb_userId");
//    localStorage.removeItem("jb_username");
//    updateAuthUI();
//  }
//
//  function updateAuthUI() {
//    const out = document.querySelectorAll('[data-auth="out"]');
//    const inn = document.querySelectorAll('[data-auth="in"]');
//    out.forEach((el) => (el.hidden = isLoggedIn()));
//    inn.forEach((el) => (el.hidden = !isLoggedIn()));
//    const navUsername = document.getElementById("nav-username");
//    if (navUsername && state.username) navUsername.textContent = state.username;
//  }
//
//  /* ---------------------------------------------------------------------
//     Small utilities
//     ------------------------------------------------------------------- */
//
//  function escapeHtml(str) {
//    return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
//      "&": "&amp;",
//      "<": "&lt;",
//      ">": "&gt;",
//      '"': "&quot;",
//      "'": "&#39;",
//    }[ch]));
//  }
//
//  function formatDate(value) {
//    if (!value) return "";
//    const d = new Date(value);
//    if (Number.isNaN(d.getTime())) return "";
//    return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
//  }
//
//  function excerpt(content, max = 220) {
//    const clean = String(content || "").trim();
//    if (clean.length <= max) return clean;
//    return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
//  }
//
//  function paragraphs(content) {
//    return escapeHtml(content)
//      .split(/\n+/)
//      .filter((p) => p.trim().length)
//      .map((p) => `<p>${p}</p>`)
//      .join("");
//  }
//
//  function slugify(text) {
//    return String(text || "")
//      .toLowerCase()
//      .trim()
//      .replace(/[^a-z0-9]+/g, "-")
//      .replace(/(^-|-$)/g, "")
//      .slice(0, 80);
//  }
//
//  let toastTimer = null;
//  function showToast(message, type = "info") {
//    const el = document.getElementById("toast");
//    el.textContent = message;
//    el.className = "toast is-visible" + (type === "error" ? " is-error" : type === "success" ? " is-success" : "");
//    clearTimeout(toastTimer);
//    toastTimer = setTimeout(() => el.classList.remove("is-visible"), 3600);
//  }
//
//  function friendlyStatusMessage(status, fallback) {
//    switch (status) {
//      case 400:
//        return "That request wasn't quite right — please check the form and try again.";
//      case 401:
//        return "Please sign in to continue.";
//      case 403:
//        return "You don't have permission to do that.";
//      case 404:
//        return "That couldn't be found — it may have been removed.";
//      case 500:
//        return fallback || "Something went wrong on our end. Please try again.";
//      default:
//        return fallback || "Something went wrong. Please try again.";
//    }
//  }
//
//  /* ---------------------------------------------------------------------
//     API helper
//     ------------------------------------------------------------------- */
//
//  async function api(path, { method = "GET", body, auth = false } = {}) {
//    const headers = { "Content-Type": "application/json" };
//    if (auth && state.token) headers.Authorization = "Bearer " + state.token;
//
//    let res;
//    try {
//      res = await fetch(path, {
//        method,
//        headers,
//        body: body !== undefined ? JSON.stringify(body) : undefined,
//      });
//    } catch (networkErr) {
//      throw new Error("Can't reach the server. Is it running?");
//    }
//
//    if (!res.ok) {
//      if (auth && (res.status === 401 || res.status === 403)) {
//        // Session is gone or invalid — clear it so the UI doesn't lie about being signed in.
//        clearAuth();
//      }
//      const err = new Error(friendlyStatusMessage(res.status));
//      err.status = res.status;
//      throw err;
//    }
//
//    if (res.status === 204) return null;
//    const contentType = res.headers.get("content-type") || "";
//    if (contentType.includes("application/json")) return res.json();
//    return res.text();
//  }
//
//  /* ---------------------------------------------------------------------
//     Router
//     ------------------------------------------------------------------- */
//
//  const views = {
//    home: document.getElementById("view-home"),
//    post: document.getElementById("view-post"),
//    login: document.getElementById("view-login"),
//    register: document.getElementById("view-register"),
//    compose: document.getElementById("view-compose"),
//    profile: document.getElementById("view-profile"),
//  };
//
//  function showView(name) {
//    Object.values(views).forEach((v) => (v.hidden = true));
//    views[name].hidden = false;
//    window.scrollTo(0, 0);
//  }
//
//  function navigate(hash) {
//    if (location.hash === hash) {
//      route();
//    } else {
//      location.hash = hash;
//    }
//  }
//
//  function parseRoute() {
//    const raw = location.hash.replace(/^#/, "") || "/";
//    const parts = raw.split("/").filter(Boolean);
//    if (parts.length === 0) return { name: "home" };
//    if (parts[0] === "post" && parts[1]) return { name: "post", id: parts[1] };
//    if (parts[0] === "edit" && parts[1]) return { name: "edit", id: parts[1] };
//    if (parts[0] === "login") return { name: "login" };
//    if (parts[0] === "register") return { name: "register" };
//    if (parts[0] === "compose") return { name: "compose" };
//    if (parts[0] === "profile") return { name: "profile" };
//    return { name: "home" };
//  }
//
//  function requireAuth(message) {
//    if (!isLoggedIn()) {
//      showToast(message, "error");
//      location.hash = "#/login";
//      return false;
//    }
//    return true;
//  }
//
//  function route() {
//    const r = parseRoute();
//    if (r.name === "home") {
//      showView("home");
//      loadFeed();
//    } else if (r.name === "post") {
//      showView("post");
//      loadPost(r.id);
//    } else if (r.name === "login") {
//      showView("login");
//    } else if (r.name === "register") {
//      showView("register");
//    } else if (r.name === "compose") {
//      if (!requireAuth("Please sign in to write a post.")) return;
//      showView("compose");
//      setupComposeForm(null);
//    } else if (r.name === "edit") {
//      if (!requireAuth("Please sign in to edit this post.")) return;
//      showView("compose");
//      setupComposeForm(r.id);
//    } else if (r.name === "profile") {
//      if (!requireAuth("Please sign in to view your profile.")) return;
//      showView("profile");
//      loadProfile();
//    }
//  }
//
//  window.addEventListener("hashchange", route);
//
//  document.getElementById("logout-link").addEventListener("click", (e) => {
//    e.preventDefault();
//    clearAuth();
//    showToast("Signed out.", "success");
//    navigate("#/");
//  });
//
//  /* ---------------------------------------------------------------------
//     Home / feed
//     ------------------------------------------------------------------- */
//
//  async function loadFeed() {
//    const container = document.getElementById("feed-list");
//    container.innerHTML = '<p class="loading-note">Loading stories…</p>';
//    try {
//      const blogs = await api("/api/blogs");
//      if (!blogs || blogs.length === 0) {
//        container.innerHTML = `
//          <div class="state-note">
//            <p>No stories yet — be the first to write one.</p>
//            <a class="btn" href="#/${isLoggedIn() ? "compose" : "register"}">Write with us</a>
//          </div>`;
//        return;
//      }
//      container.innerHTML = blogs.map(feedItemHtml).join("");
//    } catch (err) {
//      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
//    }
//  }
//
//  function feedItemHtml(blog) {
//    const author = blog.author && blog.author.username ? blog.author.username : "Unknown";
//    return `
//      <article class="feed-item">
//        <h2><a href="#/post/${blog.blogId}">${escapeHtml(blog.title)}</a></h2>
//        <p class="feed-meta">By ${escapeHtml(author)} · ${escapeHtml(formatDate(blog.createdAt))}</p>
//        <p class="feed-excerpt">${escapeHtml(excerpt(blog.content))} <a class="read-more" href="#/post/${blog.blogId}">Read more</a></p>
//      </article>`;
//  }
//
//  /* ---------------------------------------------------------------------
//     Article detail
//     ------------------------------------------------------------------- */
//
//  let currentPostId = null;
//
//  async function loadPost(id) {
//    currentPostId = id;
//    const container = document.getElementById("post-content");
//    container.innerHTML = '<p class="loading-note">Loading story…</p>';
//
//    try {
//      const blog = await api(`/api/blogs/${id}`);
//      const [likeCount, comments, liked] = await Promise.all([
//        api(`/api/likes/blog/${id}/count`).catch(() => 0),
//        api(`/api/comments/blog/${id}`).catch(() => []),
//        isLoggedIn()
//          ? api(`/api/likes/user/${state.userId}/blog/${id}/status`).catch(() => false)
//          : Promise.resolve(false),
//      ]);
//
//      const isOwner = isLoggedIn() && blog.author && String(blog.author.userId) === String(state.userId);
//      const author = blog.author && blog.author.username ? blog.author.username : "Unknown";
//
//      container.innerHTML = `
//        <article>
//          <div class="article-head">
//            <p class="eyebrow"><a href="#/">← Back to stories</a></p>
//            <h1>${escapeHtml(blog.title)}</h1>
//            <div class="byline">
//              <span>By <b>${escapeHtml(author)}</b></span>
//              <span class="dot">·</span>
//              <span>${escapeHtml(formatDate(blog.createdAt))}</span>
//            </div>
//            ${isOwner ? `
//              <div class="article-actions">
//                <a class="btn-text" href="#/edit/${blog.blogId}">Edit</a>
//                <button class="btn-text" id="delete-post-btn" type="button">Delete</button>
//              </div>` : ""}
//          </div>
//
//          <div class="article-body">${paragraphs(blog.content)}</div>
//
//          <div class="article-foot">
//            <button class="like-btn${liked ? " is-liked" : ""}" id="like-btn" type="button">
//              <span class="heart">♥</span>
//              <span id="like-count">${likeCount ?? 0}</span>
//              <span>${liked ? "Liked" : "Like"}</span>
//            </button>
//          </div>
//
//          <section class="comments-section">
//            <h3>Comments</h3>
//            <div id="comments-list"></div>
//            ${isLoggedIn() ? `
//              <form id="comment-form">
//                <div class="field">
//                  <label for="comment-content">Add a comment</label>
//                  <textarea id="comment-content" style="min-height:90px;" required></textarea>
//                </div>
//                <button class="btn btn-small" type="submit">Post comment</button>
//              </form>` : `
//              <p class="empty-comments"><a href="#/login">Sign in</a> to join the conversation.</p>`}
//          </section>
//        </article>`;
//
//      renderComments(comments);
//
//      document.getElementById("like-btn").addEventListener("click", () => toggleLike(id));
//
//      if (isOwner) {
//        document.getElementById("delete-post-btn").addEventListener("click", () => deletePost(id));
//      }
//
//      const commentForm = document.getElementById("comment-form");
//      if (commentForm) {
//        commentForm.addEventListener("submit", (e) => submitComment(e, id));
//      }
//    } catch (err) {
//      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
//    }
//  }
//
//  function renderComments(comments) {
//    const list = document.getElementById("comments-list");
//    if (!comments || comments.length === 0) {
//      list.innerHTML = '<p class="empty-comments">No comments yet — be the first to say something.</p>';
//      return;
//    }
//    list.innerHTML = comments
//      .map((c) => {
//        const owner = isLoggedIn() && c.user && String(c.user.userId) === String(state.userId);
//        const authorName = c.user && c.user.username ? c.user.username : "Unknown";
//        return `
//          <div class="comment" data-comment-id="${c.commentId}">
//            ${owner ? `<button class="comment-delete" data-delete-comment="${c.commentId}" title="Delete comment">×</button>` : ""}
//            <div class="comment-head">
//              <span class="comment-author">${escapeHtml(authorName)}</span>
//              <span class="comment-date">${escapeHtml(formatDate(c.createdAt))}</span>
//            </div>
//            <p class="comment-body">${escapeHtml(c.content)}</p>
//          </div>`;
//      })
//      .join("");
//
//    list.querySelectorAll("[data-delete-comment]").forEach((btn) => {
//      btn.addEventListener("click", () => deleteComment(btn.getAttribute("data-delete-comment")));
//    });
//  }
//
//  async function toggleLike(blogId) {
//    if (!isLoggedIn()) {
//      showToast("Please sign in to like a story.", "error");
//      navigate("#/login");
//      return;
//    }
//    const btn = document.getElementById("like-btn");
//    btn.disabled = true;
//    try {
//      await api(`/api/likes/user/${state.userId}/blog/${blogId}`, { method: "POST", auth: true });
//      const count = await api(`/api/likes/blog/${blogId}/count`).catch(() => null);
//      const nowLiked = btn.classList.toggle("is-liked");
//      btn.querySelector("span:last-child").textContent = nowLiked ? "Liked" : "Like";
//      if (count !== null) document.getElementById("like-count").textContent = count;
//    } catch (err) {
//      showToast(err.message, "error");
//    } finally {
//      btn.disabled = false;
//    }
//  }
//
//  async function submitComment(e, blogId) {
//    e.preventDefault();
//    const textarea = document.getElementById("comment-content");
//    const content = textarea.value.trim();
//    if (!content) return;
//    const submitBtn = e.target.querySelector("button[type=submit]");
//    submitBtn.disabled = true;
//    try {
//      await api(`/api/comments/user/${state.userId}/blog/${blogId}`, {
//        method: "POST",
//        auth: true,
//        body: { content },
//      });
//      textarea.value = "";
//      const comments = await api(`/api/comments/blog/${blogId}`);
//      renderComments(comments);
//      showToast("Comment posted.", "success");
//    } catch (err) {
//      showToast(err.message, "error");
//    } finally {
//      submitBtn.disabled = false;
//    }
//  }
//
//  async function deleteComment(commentId) {
//    if (!confirm("Delete this comment?")) return;
//    try {
//      await api(`/api/comments/${commentId}`, { method: "DELETE", auth: true });
//      const comments = await api(`/api/comments/blog/${currentPostId}`);
//      renderComments(comments);
//      showToast("Comment deleted.", "success");
//    } catch (err) {
//      showToast(err.message, "error");
//    }
//  }
//
//  async function deletePost(blogId) {
//    if (!confirm("Delete this story? This can't be undone.")) return;
//    try {
//      await api(`/api/blogs/${blogId}`, { method: "DELETE", auth: true });
//      showToast("Story deleted.", "success");
//      navigate("#/");
//    } catch (err) {
//      showToast(err.message, "error");
//    }
//  }
//
//  /* ---------------------------------------------------------------------
//     Login
//     ------------------------------------------------------------------- */
//
//  document.getElementById("login-form").addEventListener("submit", async (e) => {
//    e.preventDefault();
//    const errorEl = document.getElementById("login-error");
//    errorEl.hidden = true;
//    const submitBtn = document.getElementById("login-submit");
//    const username = document.getElementById("login-username").value.trim();
//    const password = document.getElementById("login-password").value;
//
//    submitBtn.disabled = true;
//    try {
//      const res = await api("/api/auth/login", { method: "POST", body: { username, password } });
//      setAuth(res);
//      e.target.reset();
//      showToast(`Welcome back, ${res.username}.`, "success");
//      navigate("#/");
//    } catch (err) {
//      const msg = err.status === 500 || err.status === 401 || err.status === 403
//        ? "Invalid username or password."
//        : err.message;
//      errorEl.textContent = msg;
//      errorEl.hidden = false;
//    } finally {
//      submitBtn.disabled = false;
//    }
//  });
//
//  /* ---------------------------------------------------------------------
//     Register
//     ------------------------------------------------------------------- */
//
//  document.getElementById("register-form").addEventListener("submit", async (e) => {
//    e.preventDefault();
//    const errorEl = document.getElementById("register-error");
//    errorEl.hidden = true;
//    const submitBtn = document.getElementById("register-submit");
//    const username = document.getElementById("register-username").value.trim();
//    const email = document.getElementById("register-email").value.trim();
//    const password = document.getElementById("register-password").value;
//
//    submitBtn.disabled = true;
//    try {
//      const res = await api("/api/auth/register", { method: "POST", body: { username, email, password } });
//      setAuth(res);
//      e.target.reset();
//      showToast(`Welcome, ${res.username}! Your account is ready.`, "success");
//      navigate("#/");
//    } catch (err) {
//      const msg = err.status === 500
//        ? "That username or email may already be taken — try another."
//        : err.message;
//      errorEl.textContent = msg;
//      errorEl.hidden = false;
//    } finally {
//      submitBtn.disabled = false;
//    }
//  });
//
//  /* ---------------------------------------------------------------------
//     Compose / edit
//     ------------------------------------------------------------------- */
//
//  let composeEditingId = null;
//  let slugTouched = false;
//
//  function setupComposeForm(editId) {
//    composeEditingId = editId;
//    slugTouched = false;
//    const form = document.getElementById("compose-form");
//    const errorEl = document.getElementById("compose-error");
//    errorEl.hidden = true;
//    form.reset();
//
//    document.getElementById("compose-eyebrow").textContent = editId ? "Edit story" : "New story";
//    document.getElementById("compose-heading").textContent = editId ? "Edit your story" : "Write something";
//    document.getElementById("compose-submit").textContent = editId ? "Save changes" : "Publish";
//
//    if (editId) {
//      document.getElementById("compose-title").disabled = true;
//      document.getElementById("compose-slug").disabled = true;
//      document.getElementById("compose-content").disabled = true;
//      api(`/api/blogs/${editId}`)
//        .then((blog) => {
//          document.getElementById("compose-title").value = blog.title || "";
//          document.getElementById("compose-slug").value = blog.slug || "";
//          document.getElementById("compose-content").value = blog.content || "";
//        })
//        .catch((err) => {
//          errorEl.textContent = err.message;
//          errorEl.hidden = false;
//        })
//        .finally(() => {
//          document.getElementById("compose-title").disabled = false;
//          document.getElementById("compose-slug").disabled = false;
//          document.getElementById("compose-content").disabled = false;
//        });
//    }
//  }
//
//  document.getElementById("compose-slug").addEventListener("input", () => {
//    slugTouched = true;
//  });
//
//  document.getElementById("compose-title").addEventListener("input", (e) => {
//    if (!slugTouched) {
//      document.getElementById("compose-slug").value = slugify(e.target.value);
//    }
//  });
//
//  document.getElementById("compose-cancel").addEventListener("click", () => {
//    history.back();
//  });
//
//  document.getElementById("compose-form").addEventListener("submit", async (e) => {
//    e.preventDefault();
//    const errorEl = document.getElementById("compose-error");
//    errorEl.hidden = true;
//    const submitBtn = document.getElementById("compose-submit");
//
//    const title = document.getElementById("compose-title").value.trim();
//    const content = document.getElementById("compose-content").value.trim();
//    let slug = document.getElementById("compose-slug").value.trim();
//    if (!slug) slug = slugify(title);
//
//    submitBtn.disabled = true;
//    try {
//      let blog;
//      if (composeEditingId) {
//        blog = await api(`/api/blogs/${composeEditingId}`, {
//          method: "PUT",
//          auth: true,
//          body: { title, content, slug },
//        });
//        showToast("Story updated.", "success");
//      } else {
//        blog = await api(`/api/blogs/author/${state.userId}`, {
//          method: "POST",
//          auth: true,
//          body: { title, content, slug },
//        });
//        showToast("Story published.", "success");
//      }
//      navigate(`#/post/${blog.blogId}`);
//    } catch (err) {
//      errorEl.textContent = err.message;
//      errorEl.hidden = false;
//    } finally {
//      submitBtn.disabled = false;
//    }
//  });
//
//  /* ---------------------------------------------------------------------
//     Profile
//     ------------------------------------------------------------------- */
//
//  async function loadProfile() {
//    const container = document.getElementById("profile-content");
//    container.innerHTML = '<p class="loading-note">Loading profile…</p>';
//    try {
//      const [user, blogs] = await Promise.all([
//        api(`/api/users/${state.userId}`, { auth: true }),
//        api(`/api/blogs/author/${state.userId}`).catch(() => []),
//      ]);
//
//      container.innerHTML = `
//        <div class="profile-card">
//          <h2 class="profile-name">${escapeHtml(user.username)}</h2>
//          <p class="profile-email">${escapeHtml(user.email)}</p>
//          <form id="bio-form">
//            <div class="field">
//              <label for="bio-input">Bio</label>
//              <textarea id="bio-input" style="min-height:110px;">${escapeHtml(user.bio || "")}</textarea>
//            </div>
//            <button class="btn btn-small" type="submit">Save bio</button>
//          </form>
//        </div>
//        <h3 style="font-family:var(--font-display); font-weight:600; margin-bottom:14px;">Your stories</h3>
//        <div class="feed-list" id="profile-feed">
//          ${blogs.length ? blogs.map(feedItemHtml).join("") : '<p class="state-note">You haven\'t written anything yet.</p>'}
//        </div>`;
//
//      document.getElementById("bio-form").addEventListener("submit", async (e) => {
//        e.preventDefault();
//        const bio = document.getElementById("bio-input").value;
//        try {
//          await api(`/api/users/${state.userId}`, {
//            method: "PUT",
//            auth: true,
//            body: { bio },
//          });
//          showToast("Bio updated.", "success");
//        } catch (err) {
//          showToast(err.message, "error");
//        }
//      });
//    } catch (err) {
//      container.innerHTML = `<p class="state-note">${escapeHtml(err.message)}</p>`;
//    }
//  }
//
//  /* ---------------------------------------------------------------------
//     Boot
//     ------------------------------------------------------------------- */
//
//  updateAuthUI();
//  route();
//})();
// ============================================================
// CONFIG
// Frontend is served from Spring Boot's static/ folder, so it
// shares an origin with the API — no CORS setup needed.
// ============================================================
const API_BASE = "/api";

// Current "session" — no real auth yet, just an ID typed into the box.
// Replace this with a JWT stored after login once Spring Security is added.
let currentUserId = null;
let currentUser = null;
let cachedBlogs = [];

function el(id) { return document.getElementById(id); }

// ============================================================
// SAFE DOM BUILDER
// Used everywhere instead of innerHTML + template literals.
// .textContent can never be interpreted as HTML/script, no matter
// what string it holds — this is what fixes the DOM XSS findings.
// ============================================================
function h(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

// ============================================================
// INPUT VALIDATION
// Any raw value typed by a user must be validated + encoded before
// it's allowed to become part of a fetch() URL. Fixes the CSRF/SSRF
// finding on the "User ID" box.
// ============================================================
function toValidId(rawValue) {
  const trimmed = String(rawValue).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Invalid ID — must be a positive whole number");
  }
  return encodeURIComponent(trimmed);
}

// ============================================================
// TOAST
// ============================================================
function showToast(message) {
  const t = el("toast");
  t.textContent = message;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// ============================================================
// SMALL HELPERS
// ============================================================
function timeAgo(timestamp) {
  if (!timestamp) return "just now";
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.floor(hrs / 24) + "d ago";
}

// ============================================================
// API HELPERS
// ============================================================
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error("GET " + path + " failed: " + res.status);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("POST " + path + " failed: " + res.status);
  const contentType = res.headers.get("content-type") || "";
  return contentType.includes("application/json") ? res.json() : res.text();
}

async function apiPut(path, body) {
  const res = await fetch(API_BASE + path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("PUT " + path + " failed: " + res.status);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(API_BASE + path, { method: "DELETE" });
  if (!res.ok) throw new Error("DELETE " + path + " failed: " + res.status);
}

// ============================================================
// NAV / VIEW SWITCHING
// ============================================================
const navLinks = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const target = link.dataset.view;
    navLinks.forEach((l) => l.classList.toggle("active", l === link));
    views.forEach((v) => v.classList.toggle("active", v.dataset.view === target));

    if (target === "dashboard") refreshDashboard();
  });
});

// ============================================================
// SESSION (userId typed into the masthead box)
// ============================================================
el("setUserBtn").addEventListener("click", async () => {
  let safeId;
  try {
    safeId = toValidId(el("userIdInput").value);
  } catch (e) {
    showToast("Please enter a valid numeric User ID");
    return;
  }

  try {
    const user = await apiGet("/users/" + safeId);
    signIn(user);
  } catch (e) {
    showToast("No user found with that ID");
  }
});

function signIn(user) {
  currentUserId = user.userId;
  currentUser = user;
  el("composeHint").textContent = "Publishing as @" + user.username;
  showToast("Signed in as @" + user.username);
  renderFeed(cachedBlogs);
  refreshDashboard();
}

// ---- Toggle between "sign in" and "create account" panels ----
el("showSignupBtn").addEventListener("click", () => {
  el("signInBox").style.display = "none";
  el("signupBox").style.display = "flex";
});
el("showSigninBtn").addEventListener("click", () => {
  el("signupBox").style.display = "none";
  el("signInBox").style.display = "flex";
});

// ---- Create account ----
el("createAccountBtn").addEventListener("click", async () => {
  const username = el("signupUsername").value.trim();
  const email = el("signupEmail").value.trim();
  const password = el("signupPassword").value.trim();

  if (!username || !email || !password) {
    showToast("Fill in username, email, and password");
    return;
  }

  try {
    const newUser = await apiPost("/users", { username, email, password });
    showToast("Account created — welcome, @" + newUser.username);
    el("signupUsername").value = "";
    el("signupEmail").value = "";
    el("signupPassword").value = "";
    el("signupBox").style.display = "none";
    el("signInBox").style.display = "flex";
    el("userIdInput").value = newUser.userId;
    signIn(newUser);
  } catch (e) {
    showToast("Could not create account — username or email may already be taken");
    console.error(e);
  }
});

// ============================================================
// DASHBOARD
// ============================================================
async function refreshDashboard() {
  if (!currentUserId) return;

  el("profileUsername").textContent = "@" + currentUser.username;
  el("profileEmail").textContent = currentUser.email;
  el("profileBio").textContent = currentUser.bio || "No bio yet — add one below.";
  el("profilePic").src = currentUser.profilePicUrl ||
    "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(currentUser.username);
  el("editBio").value = currentUser.bio || "";
  el("editPic").value = currentUser.profilePicUrl || "";

  try {
    const myBlogs = await apiGet("/blogs/author/" + toValidId(currentUserId));
    const myComments = await apiGet("/comments/user/" + toValidId(currentUserId));

    el("statPosts").textContent = myBlogs.length;
    el("statComments").textContent = myComments.length;
    el("statLikesGiven").textContent = "–"; // no backend endpoint for this yet

    renderMyPosts(myBlogs);
  } catch (e) {
    console.error(e);
  }
}

// Safe DOM construction for the dashboard's "your posts" list —
// blog titles come from the database (other users' content), so they
// must be rendered the same safe way as the main feed.
function renderMyPosts(blogs) {
  const container = el("myPostsContainer");
  container.textContent = "";

  if (!blogs.length) {
    container.appendChild(h("p", "hint", "You haven't published anything yet."));
    return;
  }

  blogs.forEach((b) => {
    const row = h("div", "mini-post-row");
    row.appendChild(h("span", "mini-post-title", b.title));
    row.appendChild(h("span", "mini-post-date", timeAgo(b.createdAt)));
    container.appendChild(row);
  });
}

el("saveProfileBtn").addEventListener("click", async () => {
  if (!currentUserId) { showToast("Set a User ID first"); return; }
  try {
    const updated = await apiPut("/users/" + toValidId(currentUserId), {
      bio: el("editBio").value.trim(),
      profilePicUrl: el("editPic").value.trim(),
    });
    currentUser = updated;
    showToast("Profile updated");
    refreshDashboard();
  } catch (e) {
    showToast("Could not update profile");
    console.error(e);
  }
});

// ============================================================
// PUBLISH
// ============================================================
el("publishBtn").addEventListener("click", async () => {
  const title = el("titleInput").value.trim();
  const content = el("contentInput").value.trim();
  if (!currentUserId) { showToast("Set a User ID first"); return; }
  if (!title || !content) { showToast("Title and content are required"); return; }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  try {
    await apiPost("/blogs/author/" + toValidId(currentUserId), { title, content, slug });
    el("titleInput").value = "";
    el("contentInput").value = "";
    showToast("Post published");
    document.querySelector('.nav-link[data-view="home"]').click();
    await loadFeed();
  } catch (e) {
    showToast("Could not publish — check the console");
    console.error(e);
  }
});

// ============================================================
// FEED — safe DOM construction (fixes the 3 DOM XSS findings)
// ============================================================
const feedContainer = el("feedContainer");

async function loadFeed() {
  try {
    cachedBlogs = await apiGet("/blogs");
    renderFeed(cachedBlogs);
  } catch (e) {
    feedContainer.textContent = "";
    feedContainer.appendChild(h("div", "empty-state", "Could not reach the backend. Is JustBlog running?"));
    console.error(e);
  }
}

function renderBlogCard(blog) {
  const excerpt = (blog.content || "").length > 220
    ? blog.content.slice(0, 220) + "…"
    : blog.content;
  const authorName = blog.author ? blog.author.username : "unknown";
  const isOwner = currentUserId && blog.author && blog.author.userId === currentUserId;

  const card = h("article", "card");
  card.dataset.blogId = blog.blogId;

  card.appendChild(h("h3", "card-title", blog.title));
  card.appendChild(h("p", "card-excerpt", excerpt));

  const meta = h("div", "card-meta");
  const metaLeft = h("div", "meta-left");
  metaLeft.appendChild(h("span", null, "@" + authorName));
  metaLeft.appendChild(h("span", null, timeAgo(blog.createdAt)));
  meta.appendChild(metaLeft);

  const metaActions = h("div", "meta-actions");

  const likeBtn = h("button", "ink-btn like");
  likeBtn.dataset.action = "like";
  likeBtn.dataset.id = blog.blogId;
  likeBtn.appendChild(document.createTextNode("♥ "));
  likeBtn.appendChild(h("span", "like-count", "–"));
  metaActions.appendChild(likeBtn);

  const commentBtn = h("button", "ink-btn comment", "✎ comments");
  commentBtn.dataset.action = "toggle-comments";
  commentBtn.dataset.id = blog.blogId;
  metaActions.appendChild(commentBtn);

  if (isOwner) {
    const deleteBtn = h("button", "ink-btn delete", "✕ delete");
    deleteBtn.dataset.action = "delete";
    deleteBtn.dataset.id = blog.blogId;
    metaActions.appendChild(deleteBtn);
  }

  meta.appendChild(metaActions);
  card.appendChild(meta);

  const commentsPanel = h("div", "comments-panel");
  commentsPanel.id = "comments-" + blog.blogId;
  const commentList = h("div", "comment-list");
  commentList.id = "comment-list-" + blog.blogId;
  commentsPanel.appendChild(commentList);

  const commentAdd = h("div", "comment-add");
  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.placeholder = "Add a comment…";
  commentInput.id = "comment-input-" + blog.blogId;
  const postBtn = h("button", "btn btn-small", "Post");
  postBtn.dataset.action = "add-comment";
  postBtn.dataset.id = blog.blogId;
  commentAdd.appendChild(commentInput);
  commentAdd.appendChild(postBtn);
  commentsPanel.appendChild(commentAdd);

  card.appendChild(commentsPanel);
  return card;
}

function renderFeed(blogs) {
  el("feedCount").textContent = blogs.length + (blogs.length === 1 ? " post" : " posts");

  feedContainer.textContent = "";

  if (!blogs.length) {
    feedContainer.appendChild(h("div", "empty-state", "No posts yet. Be the first to write one."));
    return;
  }

  blogs.forEach((blog) => feedContainer.appendChild(renderBlogCard(blog)));
  blogs.forEach((blog) => refreshLikeCount(blog.blogId));
}

async function refreshLikeCount(blogId) {
  try {
    const count = await apiGet("/likes/blog/" + blogId + "/count");
    const countEl = feedContainer.querySelector(`[data-blog-id="${blogId}"] .like-count`);
    if (countEl) countEl.textContent = count;

    if (currentUserId) {
      const liked = await apiGet(`/likes/user/${toValidId(currentUserId)}/blog/${blogId}/status`);
      const likeBtn = feedContainer.querySelector(`[data-blog-id="${blogId}"] .ink-btn.like`);
      if (likeBtn) likeBtn.classList.toggle("active", liked);
    }
  } catch (e) { /* non-critical, fail quietly */ }
}

// Event delegation for like / comment / delete actions inside the feed
feedContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;
  const blogId = btn.dataset.id; // came from our own rendered data, not raw user text

  if (action === "like") {
    if (!currentUserId) { showToast("Set a User ID first"); return; }
    await apiPost(`/likes/user/${toValidId(currentUserId)}/blog/${blogId}`);
    refreshLikeCount(blogId);
  }

  if (action === "toggle-comments") {
    const panel = el("comments-" + blogId);
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) loadComments(blogId);
  }

  if (action === "add-comment") {
    if (!currentUserId) { showToast("Set a User ID first"); return; }
    const input = el("comment-input-" + blogId);
    const content = input.value.trim();
    if (!content) return;
    await apiPost(`/comments/user/${toValidId(currentUserId)}/blog/${blogId}`, { content });
    input.value = "";
    loadComments(blogId);
  }

  if (action === "delete") {
    if (!confirm("Delete this post? This can't be undone.")) return;
    await apiDelete("/blogs/" + blogId);
    showToast("Post deleted");
    await loadFeed();
  }
});

// ============================================================
// COMMENTS — safe DOM construction (fixes another DOM XSS finding)
// ============================================================
function renderCommentRow(comment) {
  const row = h("div", "comment-row");
  row.appendChild(h("span", "comment-author", "@" + (comment.user ? comment.user.username : "unknown")));
  row.appendChild(document.createTextNode(comment.content));
  return row;
}

async function loadComments(blogId) {
  const list = el("comment-list-" + blogId);
  list.textContent = "";
  list.appendChild(h("div", "hint", "Loading comments…"));

  try {
    const comments = await apiGet("/comments/blog/" + blogId);
    list.textContent = "";

    if (!comments.length) {
      list.appendChild(h("div", "hint", "No comments yet."));
      return;
    }

    comments.forEach((c) => list.appendChild(renderCommentRow(c)));
  } catch (e) {
    list.textContent = "";
    list.appendChild(h("div", "hint", "Could not load comments."));
  }
}

// ============================================================
// INIT
// ============================================================
loadFeed();