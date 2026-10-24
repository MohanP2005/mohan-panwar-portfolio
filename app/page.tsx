import Spotlight from "@/components/Spotlight";
import Hero from "@/components/Hero";
import Work from "@/components/Work";
import Writing from "@/components/Writing";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="page">
      <Spotlight />
      <div className="content">
        <main>
          <Hero />
          <Work />
          <Writing />
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
}
