import Cta from "./components/shared/Cta";
import Education from "./components/shared/Education";
import Faq from "./components/shared/Faq";
import Fight from "./components/shared/Fight";
import Find from "./components/shared/Find";
import Footer from "./components/shared/Footer";
import Hero from "./components/shared/Hero";
import How from "./components/shared/How";
import Navbar from "./components/shared/Navbar";
import Stats from "./components/shared/Stats";
import Why from "./components/shared/Why";

export default function App() {
  return (
   <div className=""> 
     <Navbar />
     <Hero />
     <Stats />
     <Why />
     <Education />
     <Fight />
     <Find />
     <How />
     <Faq />
     <Cta />
     <Footer /> 
   </div>
  );
}