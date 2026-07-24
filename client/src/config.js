const isMobileTest = true;

const HOST = isMobileTest ? "192.168.4.50" : "localhost";

export const API_URL = import.meta.env.VITE_API_URL;
export const SERVER_URL = `http://${HOST}:5000`;