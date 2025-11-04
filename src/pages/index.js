import { useRouter } from "next/router";
import { useEffect } from "react";
import { isAuthenticated } from "../auth";

export default function Home() {
  const router = useRouter();

  const isLoggedIn = isAuthenticated();

  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  return null;
}
