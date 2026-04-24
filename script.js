const UPLOAD_API =
  "https://qodvg6r1l7.execute-api.eu-central-1.amazonaws.com/prod/upload";

// ── DOM References ───────────────────────────────────────────────────────
const uploadZone = document.getElementById("uploadZone");
const fileInput = document.getElementById("fileInput");
const previewArea = document.getElementById("previewArea");
const previewImage = document.getElementById("previewImage");
const fileNameEl = document.getElementById("fileName");
const fileSizeEl = document.getElementById("fileSize");
const changeBtn = document.getElementById("changeBtn");
const uploadBtn = document.getElementById("uploadBtn");
const btnLabel = document.getElementById("btnLabel");
const statusBox = document.getElementById("statusBox");
const statusIcon = document.getElementById("statusIcon");
const statusText = document.getElementById("statusText");

let selectedFile = null;

// ── Upload Zone — Click ──────────────────────────────────────────────────
uploadZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  if (e.target.files[0]) handleFile(e.target.files[0]);
});

changeBtn.addEventListener("click", () => {
  resetState();
  fileInput.click();
});

// ── Upload Zone — Drag & Drop ────────────────────────────────────────────
uploadZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadZone.classList.add("drag-over");
});

uploadZone.addEventListener("dragleave", (e) => {
  if (!uploadZone.contains(e.relatedTarget)) {
    uploadZone.classList.remove("drag-over");
  }
});

uploadZone.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadZone.classList.remove("drag-over");

  const file = e.dataTransfer.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showStatus(
      "error",
      "✕",
      "Please drop an image file (JPG, PNG, GIF, WebP, or BMP).",
    );
    return;
  }

  handleFile(file);
});

// ── File Handling ────────────────────────────────────────────────────────
function handleFile(file) {
  selectedFile = file;
  clearStatus();

  const reader = new FileReader();
  reader.onload = (e) => {
    previewImage.src = e.target.result;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);
    showPreview();
  };
  reader.readAsDataURL(file);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── State Helpers ────────────────────────────────────────────────────────
function showPreview() {
  uploadZone.style.display = "none";
  previewArea.style.display = "flex";
  uploadBtn.disabled = false;
}

function resetState() {
  uploadZone.style.display = "flex";
  previewArea.style.display = "none";
  uploadBtn.disabled = true;
  fileInput.value = "";
  selectedFile = null;
  clearStatus();
  setLoading(false);
}

function setLoading(active) {
  uploadBtn.classList.toggle("loading", active);
  uploadBtn.disabled = active;
  btnLabel.textContent = active ? "Uploading…" : "Upload & Resize";
}

function showStatus(type, icon, message) {
  statusBox.className = `status-box visible ${type}`;
  statusIcon.textContent = icon;
  statusText.textContent = message;
}

function clearStatus() {
  statusBox.className = "status-box";
  statusIcon.textContent = "";
  statusText.textContent = "";
}

// ── S3 Upload ────────────────────────────────────────────────────────────
uploadBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  setLoading(true);
  clearStatus();

  try {
    const base64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(selectedFile);
    });

    const uploadRes = await fetch(
      `${UPLOAD_API}?filename=${encodeURIComponent(selectedFile.name)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: base64,
      },
    );

    if (!uploadRes.ok) {
      throw new Error(`Upload failed (HTTP ${uploadRes.status})`);
    }

    setLoading(false);
    uploadBtn.disabled = true;
    showStatus(
      "success",
      "✓",
      "Image uploaded! Check your email for the notification and the resized image will be ready shortly.",
    );
  } catch (err) {
    setLoading(false);
    console.error("Upload error:", err);

    const msg =
      err instanceof TypeError
        ? "Network error — check your internet connection and try again."
        : err.message || "Upload failed. Please try again.";

    showStatus("error", "✕", msg);
  }
});
