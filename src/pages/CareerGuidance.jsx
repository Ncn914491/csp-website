import React from 'react';

const CareerGuidance = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-800">Comprehensive Career Guidance: Career Paths in India</h1>
      
      {/* Career Paths After 10th */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Paths After 10th Grade</h2>
        <p className="mb-4">
          After Class 10, Indian students typically either continue academic studies (move to 11th grade) or pursue vocational/trade education. 
          Vocational courses and diplomas offer hands-on skills in fields like electrician, plumber, fitter, computer applications, and hospitality. 
          These programs (often 1–3 years long) prepare students for immediate employment or further technical studies.
        </p>
        
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 mt-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border text-left">Course/Path</th>
                <th className="py-2 px-4 border text-left">Duration</th>
                <th className="py-2 px-4 border text-left">Eligibility</th>
                <th className="py-2 px-4 border text-left">Typical Careers</th>
                <th className="py-2 px-4 border text-left">Starting Salary (approx.)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 px-4 border">10th → 11th/12th (any stream)</td>
                <td className="py-2 px-4 border">2 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Continue school; choose stream (Science, Commerce, Arts)</td>
                <td className="py-2 px-4 border">School continuation</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-2 px-4 border">ITI Trade (Electrician, etc.)</td>
                <td className="py-2 px-4 border">1-2 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Electrician, Plumber, Welder, Fitter in industry or govt.</td>
                <td className="py-2 px-4 border">₹10-20K/month</td>
              </tr>
              <tr>
                <td className="py-2 px-4 border">Polytechnic Diploma</td>
                <td className="py-2 px-4 border">3 years</td>
                <td className="py-2 px-4 border">10th pass</td>
                <td className="py-2 px-4 border">Technician or engineer in Mechanical, Civil, etc.</td>
                <td className="py-2 px-4 border">₹15-25K/month</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Example Career Path:</h3>
          <p className="text-blue-700">After 10th → ITI (2 years) → Junior Technician job (e.g., Govt. PSU) → Progressive promotions or further studies (e.g., 2nd year B.Tech lateral entry).</p>
        </div>
      </section>

      {/* Career Paths After 12th */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Career Paths After 12th Grade</h2>
        
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Science Stream (PCM/PCB)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Engineering & Technology</h4>
              <p>12th (PCM) → JEE/MHT-CET → B.E./B.Tech (4 years) in fields like Computer Science, Mechanical, etc.</p>
              <p className="mt-2 text-sm text-gray-600">Average starting salary: ~₹9.1 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Medicine & Allied Health</h4>
              <p>12th (PCB) → NEET → MBBS (5.5 years) → House Surgeon → MD/MS (3 years)</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹3-6 LPA, up to ₹15+ LPA for specialists</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Commerce Stream</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Business & Finance</h4>
              <p>B.Com/BBA (3 years) → MBA or professional courses (CA, CS, CFA)</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹2-4 LPA, up to ₹15+ LPA with experience</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold mb-2">Chartered Accountancy (CA)</h4>
              <p>12th → CA Foundation → IPCC → Articleship → CA Final</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹6-8 LPA in Big 4 firms</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2 text-blue-600">Arts and Humanities Stream</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Law (LLB)</h4>
              <p>12th → 5-year BA LLB or 3-year LLB after graduation</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹5-8 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Design & Media</h4>
              <p>Degrees from NIFT, NID, or journalism schools</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹3-6 LPA</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h4 className="font-semibold">Hotel & Hospitality</h4>
              <p>BHM or diplomas in hotel management</p>
              <p className="mt-2 text-sm text-gray-600">Starting salary: ₹2-4 LPA + service charges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Government and Public Sector Careers */}
      <section className="mb-12 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Government and Public Sector Careers</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Civil Services (IAS, IPS, IFS)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Requires graduation and UPSC Civil Services Exam</li>
              <li>IAS officer starts at ₹56,100 basic pay (~₹70k total with allowances)</li>
              <li>Prestigious administrative roles with excellent career growth</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Banking Sector (Public)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>IBPS/SBI exams for Probationary Officers (PO) and Clerks</li>
              <li>New SBI PO's take-home: ~₹42,000 basic (~₹7-8 LPA total)</li>
              <li>Promotion to Manager/Chief Manager (₹15-20 LPA)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Public Sector Undertakings (PSUs)</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Recruit engineering graduates via GATE or campus</li>
              <li>Examples: BHEL, ONGC, IOCL, DRDO, ISRO</li>
              <li>Starting salary: ₹9-10 LPA (including allowances)</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-xl font-semibold mb-2 text-blue-800">Teaching</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Government school teachers: B.Ed + TET/CTET</li>
              <li>College lecturers: NET/SLET required</li>
              <li>Starting salary: ₹30-40K/month (schools), ~₹6-7 LPA (colleges)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Example Career Roadmaps */}
      <section className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-blue-700 border-b pb-2">Example Career Roadmaps</h2>
        
        <div className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h3 className="font-semibold text-lg text-green-800">Software Engineer</h3>
            <p className="text-green-700">12th (PCM) → B.Tech in CS → Internship → Software Developer (₹4-6 LPA) → Senior Dev/Architect (₹15-20 LPA)</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h3 className="font-semibold text-lg text-blue-800">Doctor</h3>
            <p className="text-blue-700">12th (PCB) → NEET → MBBS (5.5 yrs) → House Surgeon → MD (3 yrs) → Specialist/Consultant (₹12-18 LPA+)</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h3 className="font-semibold text-lg text-purple-800">Civil Services (IAS/IPS)</h3>
            <p className="text-purple-700">12th → B.A. (Economics) → UPSC Prelims/Mains → IAS (₹70k entry) → District Collector → State Secretary</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h3 className="font-semibold text-lg text-yellow-800">Technical Diploma to Engineer</h3>
            <p className="text-yellow-700">10th → Polytechnic Diploma (3 yrs) → Junior Engineer (₹3-4 LPA) → B.Tech lateral entry → Chief Engineer (₹10-15 LPA)</p>
          </div>
        </div>
      </section>
      
      <div className="mt-8 bg-blue-50 p-4 rounded-lg text-center">
        <p className="text-blue-800 font-medium">
          Note: Salaries mentioned are approximate and can vary based on location, organization, and individual performance. 
          Always research current market trends for the most up-to-date information.
        </p>
      </div>
    </div>
  );
};

export default CareerGuidance;
