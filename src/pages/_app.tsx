import "@/styles/globals.css";
import "katex/dist/katex.min.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { LanguageProvider } from "@/context/LanguageContext";

const MusicPlayer = dynamic(() => import("@/components/MusicPlayer"), {
  ssr: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <Component {...pageProps} />
      <MusicPlayer />
    </LanguageProvider>
  );
}
