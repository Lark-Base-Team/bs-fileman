import "reset-css";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import "@/i18n";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
