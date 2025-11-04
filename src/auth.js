import api from "./axiosConfig";
import { useEffect } from "react";

export async function login({ email, password }) {
  try {
    const response = await api.post("/auth/login", { email, password });
    if (typeof window !== "undefined") {
      sessionStorage.setItem("accessToken", response.data.accessToken);
      sessionStorage.setItem("refreshToken", response.data.refreshToken);
      window.location.href = "/dashboard";
    }
  } catch (error) {
    console.error(error);
  }
}

export async function logout() {
  try {
    const refreshToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem("refreshToken")
        : null;
    const response = await api.post("/auth/logout", {
      refresh_token: refreshToken,
    });
    if (response.status === 200) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("accessToken");
        window.location.href = "/login";
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export function isAuthenticated() {
  if (typeof window === "undefined") return false;
  const accessToken = sessionStorage.getItem("accessToken");
  return !!accessToken;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("accessToken");
}

export function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    useEffect(() => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
      }
    }, []);

    return <WrappedComponent {...props} />;
  };
}
