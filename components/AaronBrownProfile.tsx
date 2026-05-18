import { Star, Award, Calendar, MessageCircle } from 'lucide-react'

const AaronBrownProfile = () => {
  return (
    <div className="min-h-screen bg-[#0A1428] text-white pb-20 font-sans">
      {/* Hero Section */}
      <div className="relative h-[420px] md:h-[520px]">
        <img
          src="/images/aaron-brown-hero.jpg"
          alt="Aaron Brown Training"
          className="w-full h-full object-cover object-[50%_40%] brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#0A1428]" />

        {/* Enhanced Avatar */}
        <div className="absolute -bottom-16 left-6 border-4 border-[#0A1428] rounded-3xl overflow-hidden shadow-2xl">
          <img
            src="/images/aaron-brown-avatar.jpg"
            alt="Aaron Brown"
            className="w-36 h-36 object-cover"
          />
        </div>

        {/* Floating Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button className="bg-white/10 backdrop-blur-lg p-3.5 rounded-2xl hover:bg-white/20 transition-all">
            <MessageCircle size={26} />
          </button>
          <button className="bg-[#00E5C0] hover:bg-[#00f5d0] text-black p-3.5 rounded-2xl font-bold transition-all">
            Book
          </button>
        </div>
      </div>

      <div className="px-6 pt-20">
        {/* Name & Title */}
        <h1 className="text-4xl font-bold tracking-tight">Aaron Brown</h1>
        <p className="text-[#00E5C0] text-xl font-semibold mt-1">Strength & Performance Coach</p>

        {/* Bio */}
        <p className="mt-6 text-[#A3B4CC] leading-relaxed text-[15.5px]">
          Elite strength coach with over 12 years experience. Specializing in transforming
          everyday people into stronger, more confident versions of themselves. Real results.
          No shortcuts.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-9">
          {[
            { number: '12', label: 'Years Exp' },
            { number: '650+', label: 'Clients' },
            { number: '97%', label: 'Success' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1E2937] rounded-3xl p-6 text-center border border-white/5">
              <div className="text-4xl font-bold text-[#00E5C0]">{stat.number}</div>
              <div className="text-sm text-[#A3B4CC] mt-1.5 tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Specialties */}
        <div className="mt-11">
          <h3 className="font-bold text-lg mb-4">Specialties</h3>
          <div className="flex flex-wrap gap-3">
            {['Strength Training', 'Hypertrophy', 'Athletic Performance', 'Fat Loss Transformation', 'Powerlifting'].map((spec, i) => (
              <div key={i} className="bg-[#1E2937] px-6 py-3.5 rounded-2xl text-sm font-medium border border-[#00E5C0]/30 hover:border-[#00E5C0] transition-colors">
                {spec}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-11">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="text-[#FF4D6D]" size={22} />
            Certifications
          </h3>
          <div className="flex flex-wrap gap-4">
            {['NASM CPT', 'CSCS', 'FMS Level 2', 'USAW'].map((cert, i) => (
              <div key={i} className="bg-[#1E2937] px-6 py-4 rounded-2xl flex items-center gap-3 text-sm">
                <div className="w-7 h-7 bg-[#00E5C0] text-black rounded-full flex items-center justify-center font-bold text-xs">✓</div>
                {cert}
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-5">What Clients Say</h3>
          <div className="space-y-6">
            {[
              { name: 'Marcus T.', text: "Aaron helped me deadlift 180kg and drop 15kg body fat. Absolute legend." },
              { name: 'Rachel P.', text: "Best coach I've ever had. Professional, motivating, and gets results." },
            ].map((review, i) => (
              <div key={i} className="bg-[#1E2937] p-7 rounded-3xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={20} fill="#00E5C0" className="text-[#00E5C0]" />
                  ))}
                </div>
                <p className="text-[#A3B4CC] leading-relaxed">&ldquo;{review.text}&rdquo;</p>
                <p className="text-sm mt-4 text-white/70">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fixed CTA Button */}
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <button className="w-full bg-[#00E5C0] hover:bg-[#00f5d0] active:scale-[0.985] transition-all text-black font-bold text-[17px] py-6 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-[#00E5C0]/40">
            <Calendar size={26} />
            BOOK A SESSION WITH AARON
          </button>
        </div>
      </div>
    </div>
  )
}

export default AaronBrownProfile
