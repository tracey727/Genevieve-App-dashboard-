/*
  MANUAL MODE works immediately after deployment.
  Tap each service to change it between ONLINE and OFFLINE.

  To use real public health endpoints later:
  1. Change mode to "live".
  2. Add an HTTPS URL for each service.
  3. Each URL must be publicly reachable and allow browser requests (CORS).
*/
window.GENEVIEVE_CONFIG = {
  mode: "manual",
  timeoutMs: 5000,
  services: {
    main: {
      label: "Main Command Centre",
      healthUrl: ""
    },
    health: {
      label: "Health",
      healthUrl: ""
    },
    animal: {
      label: "Animal",
      healthUrl: ""
    }
  }
};
