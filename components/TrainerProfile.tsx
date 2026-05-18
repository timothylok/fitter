import { Star, Award, Users, Calendar, MessageCircle } from 'lucide-react'

const TrainerProfile = () => {
  return (
    <div className="min-h-screen bg-[#0A1428] text-white pb-20">
      {/* Hero Section */}
      <div className="relative h-[380px]">
        <img
          src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800"
          alt="Jordan Kane training"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/60 to-[#0A1428]" />

        {/* Avatar */}
        <div className="absolute -bottom-16 left-6 border-4 border-[#0A1428] rounded-3xl overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300"
            alt="Jordan Kane"
            className="w-32 h-32 object-cover"
          />
        </div>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-3">
          <button className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <MessageCircle size={24} />
          </button>
          <button className="bg-[#00E5C0] text-black p-3 rounded-2xl font-bold">
            Book
          </button>
        </div>
      </div>

      <div className="px-6 pt-20">
        {/* Name & Title */}
        <h1 className="text-4xl font-bold">Jordan Kane</h1>
        <p className="text-[#00E5C0] text-xl font-semibold mt-1">Strength & Performance Coach</p>

        {/* Bio */}
        <p className="mt-6 text-[#A3B4CC] leading-relaxed">
          Former competitive athlete turned coach. Helping driven individuals build strength,
          confidence and long-term performance. No fluff. Just results.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[
            { number: '12', label: 'Years Exp' },
            { number: '500+', label: 'Clients' },
            { number: '98%', label: 'Success' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1E2937] rounded-3xl p-5 text-center">
              <div className="text-3xl font-bold text-[#00E5C0]">{stat.number}</div>
              <div className="text-sm text-[#A3B4CC] mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Specialties */}
        <div className="mt-10">
          <h3 className="font-bold text-lg mb-4">Specialties</h3>
          <div className="flex flex-wrap gap-3">
            {['Strength Training', 'Hypertrophy', 'Athletic Performance', 'Fat Loss', 'Olympic Lifting'].map((spec, i) => (
              <div key={i} className="bg-[#1E2937] px-6 py-3 rounded-2xl text-sm font-medium border border-[#00E5C0]/20">
                {spec}
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mt-10">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Award className="text-[#FF4D6D]" /> Certifications
          </h3>
          <div className="flex gap-4 flex-wrap">
            {['NASM', 'CSCS', 'FMS', 'USAW'].map((cert, i) => (
              <div key={i} className="bg-[#1E2937] px-5 py-3 rounded-2xl text-sm font-medium flex items-center gap-2">
                <div className="w-6 h-6 bg-[#00E5C0] text-black rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                {cert} Certified
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12">
          <h3 className="font-bold text-lg mb-5">Client Results</h3>
          <div className="space-y-6">
            {[
              { name: 'Marcus T.', text: "Lost 18kg and added 45kg to my deadlift in 6 months. Best investment I've ever made." },
              { name: 'Sarah K.', text: "Jordan doesn't just train you — he transforms how you think about your body." },
            ].map((review, i) => (
              <div key={i} className="bg-[#1E2937] p-6 rounded-3xl">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={18} fill="#00E5C0" className="text-[#00E5C0]" />
                  ))}
                </div>
                <p className="text-[#A3B4CC]">&ldquo;{review.text}&rdquo;</p>
                <p className="text-sm text-white/70 mt-4">— {review.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Big CTA */}
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <button className="w-full bg-[#00E5C0] hover:bg-[#00E5C0]/90 transition-colors text-black font-bold text-xl py-5 rounded-3xl flex items-center justify-center gap-3 shadow-2xl shadow-[#00E5C0]/30">
            <Calendar size={24} />
            Book Your Session Now
          </button>
        </div>
      </div>
    </div>
  )
}

export default TrainerProfile
