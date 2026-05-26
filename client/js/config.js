(function(){
  const renderBackend = "https://iis-backend.onrender.com";
  const API_HOST = window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : renderBackend;

  window.API_BASE_URL = API_HOST;
  window.API = `${API_HOST}/api`;
  window.SOCKET_URL = API_HOST;
  window.BACKEND_URL = API_HOST;
})();
