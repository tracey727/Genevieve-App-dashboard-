(() => {
  "use strict";

  const config = window.GENEVIEVE_CONFIG || { mode: "manual", services: {} };
  const serviceKeys = ["main", "health", "animal"];
  const storageKey = "genevieve-ecosystem-test-status-v1";
  const cards = Object.fromEntries(
    serviceKeys.map((key) => [key, document.querySelector(`[data-service="${key}"]`)])
  );

  const overallStatus = document.getElementById("overallStatus");
  const lastUpdated = document.getElementById("lastUpdated");
  const modeBadge = document.getElementById("modeBadge");
  const connectionNote = document.getElementById("connectionNote");
  const refreshButton = document.getElementById("refreshButton");
  const allOnlineButton = document.getElementById("allOnlineButton");
  const allOfflineButton = document.getElementById("allOfflineButton");

  const readSavedState = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
      return Object.fromEntries(serviceKeys.map((key) => [key, Boolean(parsed[key])]));
    } catch {
      return Object.fromEntries(serviceKeys.map((key) => [key, false]));
    }
  };

  let state = readSavedState();

  const saveState = () => {
    localStorage.setItem(storageKey, JSON.stringify(state));
  };

  const setUpdatedTime = () => {
    lastUpdated.textContent = new Intl.DateTimeFormat("en-AU", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date());
  };

  const render = () => {
    serviceKeys.forEach((key) => {
      const card = cards[key];
      const online = Boolean(state[key]);
      card.classList.toggle("online", online);
      card.querySelector(".status-text").textContent = online ? "ONLINE" : "OFFLINE";
      card.querySelector(".status-button").setAttribute("aria-pressed", String(online));
    });

    const onlineCount = serviceKeys.filter((key) => state[key]).length;
    if (onlineCount === serviceKeys.length) {
      overallStatus.textContent = "ALL ONLINE";
      overallStatus.style.color = "#177a45";
    } else if (onlineCount === 0) {
      overallStatus.textContent = "OFFLINE";
      overallStatus.style.color = "#b42318";
    } else {
      overallStatus.textContent = `${onlineCount} OF ${serviceKeys.length} ONLINE`;
      overallStatus.style.color = "#7a5b00";
    }
  };

  const setAll = (online) => {
    state = Object.fromEntries(serviceKeys.map((key) => [key, online]));
    saveState();
    setUpdatedTime();
    render();
  };

  const checkUrl = async (url, timeoutMs) => {
    if (!url) return false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });
      return response.ok;
    } catch {
      return false;
    } finally {
      clearTimeout(timer);
    }
  };

  const refreshLiveStatus = async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = "Checking…";
    try {
      const results = await Promise.all(
        serviceKeys.map(async (key) => {
          const service = config.services?.[key] || {};
          const online = await checkUrl(service.healthUrl, config.timeoutMs || 5000);
          return [key, online];
        })
      );
      state = Object.fromEntries(results);
      saveState();
      setUpdatedTime();
      render();
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh";
    }
  };

  serviceKeys.forEach((key) => {
    cards[key].querySelector(".status-button").addEventListener("click", () => {
      if (config.mode === "live") return;
      state[key] = !state[key];
      saveState();
      setUpdatedTime();
      render();
    });
  });

  allOnlineButton.addEventListener("click", () => setAll(true));
  allOfflineButton.addEventListener("click", () => setAll(false));

  refreshButton.addEventListener("click", () => {
    if (config.mode === "live") {
      refreshLiveStatus();
    } else {
      setUpdatedTime();
      render();
    }
  });

  if (config.mode === "live") {
    modeBadge.textContent = "LIVE CHECK";
    connectionNote.textContent = "Live mode checks the public health URLs configured in config.js.";
    allOnlineButton.hidden = true;
    allOfflineButton.hidden = true;
    refreshLiveStatus();
  } else {
    modeBadge.textContent = "MANUAL TEST";
    connectionNote.textContent = "Manual test mode. Status choices are saved on this device.";
    render();
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/service-worker.js").catch(() => {});
    });
  }
})();
