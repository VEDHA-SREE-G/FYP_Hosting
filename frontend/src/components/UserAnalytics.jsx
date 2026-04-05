import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { Award, Zap, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserAnalytics = () => {
  const [data, setData] = useState({ matchDistribution: [], totalMatchesAnalyzed: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/schemes/user-analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Error fetching user analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (
     <div className="flex justify-center items-center h-64 w-full">
        <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-orange-200 rounded-full mb-4"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
     </div>
  );

  const totalHighMatch = data.matchDistribution.find(d => d.name.includes("High"))?.value || 0;
  const matchRatio = data.totalMatchesAnalyzed > 0 
                     ? Math.round((totalHighMatch / data.totalMatchesAnalyzed) * 100) 
                     : 0;

  const radialData = [{ name: 'Eligibility Ratio', value: matchRatio, fill: '#F97316' }];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-yellow-500 px-6 py-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-6 h-6" /> Your Personalized Eligibility Portfolio
          </h3>
          <p className="text-orange-100 mt-1">Analyzed against {data.totalMatchesAnalyzed} active schemes</p>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Eligibility Score Visualizer */}
          <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200">
             <h4 className="text-gray-600 font-semibold mb-4 text-center">Top Match Probability</h4>
             <div className="h-48 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <RadialBarChart 
                    cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" 
                    barSize={20} data={radialData} startAngle={90} endAngle={-270}
                 >
                   <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                   <RadialBar
                     minAngle={15} background clockWise
                     dataKey="value" cornerRadius={10}
                   />
                   <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold fill-gray-800">
                     {matchRatio}%
                   </text>
                 </RadialBarChart>
               </ResponsiveContainer>
             </div>
             <p className="text-xs text-gray-500 text-center mt-2">of all schemes perfectly match your profile.</p>
          </div>

          {/* Bar Chart Match Distribution */}
          <div className="lg:col-span-2">
            <h4 className="text-gray-800 font-bold mb-6 flex items-center gap-2">
               <Zap className="w-5 h-5 text-orange-500" /> Match Tier Breakdown
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.matchDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={50} animationDuration={1500}>
                    {data.matchDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        <div className="bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center px-8">
           <span className="text-gray-600 font-medium">Ready to claim your benefits?</span>
           <button 
             onClick={() => navigate('/user/schemes')}
             className="flex items-center gap-2 bg-orange-100 text-orange-700 px-6 py-2 rounded-full font-bold hover:bg-orange-200 transition"
           >
             View Eligible Schemes <ChevronRight className="w-4 h-4" />
           </button>
        </div>
      </div>
      
    </div>
  );
};

export default UserAnalytics;
