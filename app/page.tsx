import { Navbar } from "@/components/layout/navbar";
import { Hero } from "@/components/home/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
      </main>
    </div>
  );
}
