import "@/src/globals.css";
import { ThemeProvider } from "@/src/contexts/ThemeContext";

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
