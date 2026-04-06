// ═══════════════════════════════════════════════
// EMERIE CREDIT UNION — VOICE WIDGET
// Ultravox-powered voice assistant
// ═══════════════════════════════════════════════

(() => {
  const VALID_PAGES = ["/", "/membership.html", "/business.html", "/loans.html", "/locations.html", "/about.html"];

  let ultravoxSession = null;
  let status = "disconnected";
  let isOpen = false;
  let isMuted = false;

  // DOM refs (set after inject)
  let triggerBtn, panel, statusDot, headerTitle, minimizeBtn;
  let transcriptArea, statusLabel, micBtn, callBtn;

  // ═══ INJECT HTML ═══
  function injectWidget() {
    // Trigger button
    const trigger = document.createElement("button");
    trigger.className = "voice-trigger";
    trigger.setAttribute("aria-label", "Open voice assistant");
    trigger.innerHTML = `
      <span class="trigger-pulse"></span>
      <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    `;
    document.body.appendChild(trigger);
    triggerBtn = trigger;

    // Panel
    const p = document.createElement("div");
    p.className = "voice-panel";
    p.innerHTML = `
      <div class="voice-panel-header">
        <div class="header-left">
          <span class="status-dot" id="vw-status-dot"></span>
          <span class="header-title">Emerie Assistant</span>
        </div>
        <button class="minimize-btn" aria-label="Minimize">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
      </div>
      <div class="voice-transcript" id="vw-transcript">
        <div class="empty-state">Tap the microphone to talk with our AI assistant.</div>
      </div>
      <div class="voice-controls">
        <span class="status-label" id="vw-status-label">Start a conversation</span>
        <div class="control-btns">
          <button class="ctrl-btn mic-btn" id="vw-mic-btn" style="display:none" aria-label="Toggle microphone">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </button>
          <button class="ctrl-btn call-btn start" id="vw-call-btn" aria-label="Start call">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="voice-panel-footer">
        <span>Powered by <strong>Laimen AI</strong></span>
      </div>
    `;
    document.body.appendChild(p);
    panel = p;

    // Grab refs
    statusDot = document.getElementById("vw-status-dot");
    minimizeBtn = p.querySelector(".minimize-btn");
    transcriptArea = document.getElementById("vw-transcript");
    statusLabel = document.getElementById("vw-status-label");
    micBtn = document.getElementById("vw-mic-btn");
    callBtn = document.getElementById("vw-call-btn");

    // Events
    triggerBtn.addEventListener("click", () => {
      if (isOpen) {
        closePanel();
      } else {
        openPanel();
        if (status === "disconnected") startCall();
      }
    });

    minimizeBtn.addEventListener("click", () => {
      closePanel();
    });

    micBtn.addEventListener("click", toggleMic);
    callBtn.addEventListener("click", () => {
      if (isActive()) endCall();
      else startCall();
    });
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    triggerBtn.classList.add("active");
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
    triggerBtn.classList.remove("active");
    if (!isActive()) {
      clearTranscripts();
    }
  }

  function isActive() {
    return status !== "disconnected" && status !== "disconnecting";
  }

  // ═══ STATUS ═══
  const STATUS_LABELS = {
    disconnected: "Start a conversation",
    disconnecting: "Ending call...",
    connecting: "Connecting...",
    idle: "Connected",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
  };

  function updateStatus(newStatus) {
    status = newStatus;
    statusLabel.textContent = STATUS_LABELS[status] || status;
    const active = isActive();
    statusDot.classList.toggle("active", active);
    micBtn.style.display = active ? "flex" : "none";

    if (active) {
      callBtn.className = "ctrl-btn call-btn end";
      callBtn.setAttribute("aria-label", "End call");
      callBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`;
    } else {
      callBtn.className = "ctrl-btn call-btn start";
      callBtn.setAttribute("aria-label", "Start call");
      callBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`;
    }
  }

  // ═══ TRANSCRIPTS ═══
  let renderedCount = 0;

  function clearTranscripts() {
    renderedCount = 0;
    transcriptArea.innerHTML = `<div class="empty-state">Tap the microphone to talk with our AI assistant.</div>`;
  }

  function renderTranscripts(transcripts) {
    // Remove empty state on first transcript
    const empty = transcriptArea.querySelector(".empty-state");
    if (empty && transcripts.length > 0) empty.remove();

    for (let i = 0; i < transcripts.length; i++) {
      const t = transcripts[i];
      const existingEl = transcriptArea.children[i];

      if (existingEl) {
        // Update existing bubble text and final state in place
        const bubble = existingEl.querySelector(".bubble");
        if (bubble) {
          if (bubble.textContent !== t.text) bubble.textContent = t.text;
          bubble.classList.toggle("interim", !t.isFinal);
        }
      } else {
        // Append new bubble
        const wrapper = document.createElement("div");
        wrapper.className = `voice-msg ${t.speaker}`;
        const bubble = document.createElement("div");
        bubble.className = `bubble${t.isFinal ? "" : " interim"}`;
        bubble.textContent = t.text;
        wrapper.appendChild(bubble);
        transcriptArea.appendChild(wrapper);
      }
    }

    // Scroll to bottom only when new items appear
    if (transcripts.length > renderedCount) {
      renderedCount = transcripts.length;
      requestAnimationFrame(() => {
        transcriptArea.scrollTop = transcriptArea.scrollHeight;
      });
    }
  }

  // ═══ SESSION ═══
  async function startCall() {
    updateStatus("connecting");
    clearTranscripts();
    transcriptArea.innerHTML = `<div class="empty-state">Connecting...</div>`;

    try {
      const res = await fetch("/api/ultravox", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create call");
      }
      const { joinUrl } = await res.json();

      const { UltravoxSession } = await import("/js/ultravox-bundle.js");
      ultravoxSession = new UltravoxSession();

      // Force normal audio playback
      const origPlay = Audio.prototype.play;
      Audio.prototype.play = function () {
        this.playbackRate = 1.0;
        return origPlay.call(this);
      };

      ultravoxSession.addEventListener("status", () => {
        updateStatus(ultravoxSession.status);
      });

      ultravoxSession.addEventListener("transcripts", () => {
        renderTranscripts([...ultravoxSession.transcripts]);
      });

      ultravoxSession.joinCall(joinUrl);
    } catch (err) {
      console.error("Voice widget error:", err);
      transcriptArea.innerHTML = `<div class="error-msg">${err.message || "Failed to connect. Please try again."}</div>`;
      updateStatus("disconnected");
    }
  }

  async function endCall() {
    if (ultravoxSession) {
      try {
        await ultravoxSession.leaveCall();
      } catch (e) {}
      ultravoxSession = null;
    }
    isMuted = false;
    micBtn.classList.remove("muted");
    updateStatus("disconnected");
  }

  function toggleMic() {
    if (!ultravoxSession) return;
    ultravoxSession.toggleMicMute();
    isMuted = !isMuted;
    micBtn.classList.toggle("muted", isMuted);
  }

  // ═══ INIT ═══
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectWidget);
  } else {
    injectWidget();
  }
})();
