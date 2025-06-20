import heroImg from '@/assets/images/hero.png'
// import type { Patients } from '@shared/index'
import type { User } from '@shared/index'

export default function Hero() {
  return (
    <div className="wrapper flex flex-col lg:flex-row items-center justify-between gap-12 bg-primary text-white py-12">
      <div className="lg:w-1/2 space-y-8">
        <h1 className="text-4xl lg:text-5xl font-bold">
          Embark on Your Path to Wellness with ZeroCancer
        </h1>
        <p className="text-lg">
          At Zerocancer, we advocate for collaborative efforts among all
          stakeholders, emphasizing the integration of information and
          biotechnology in the comprehensive fight against cancers. Our
          commitment extends across all facets of prevention and management,
          working diligently until the incidence and impact of this menace are
          minimized to zero in Africa.
        </p>
        <button className="bg-secondary px-8 py-2 w-full lg:w-auto rounded-lg font-semibold text-lg">
          Get Started
        </button>
      </div>
      <div className="flex justify-end">
        <img
          src={heroImg}
          alt="image of a woman"
          className="w-full lg:w-9/10"
        />
      </div>
    </div>
  )
}
