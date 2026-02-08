import React, { useEffect, useState } from 'react';
import { db } from '../../services/mockDb';
import { Appointment, AppointmentStatus } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, isSameDay, addDays } from 'date-fns';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    appointmentsToday: 0,
    revenueWeek: 0,
    occupancyRate: 0,
    topService: ''
  });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
        const appts = await db.getAppointments();
        const services = await db.getServices();

        // 1. Appointments Today
        const today = new Date();
        const todayAppts = appts.filter(a => isSameDay(new Date(a.start_time), today) && a.status !== AppointmentStatus.CANCELLED);
        
        // 2. Revenue Week
        const getStartOfWeek = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day;
            date.setDate(diff);
            date.setHours(0, 0, 0, 0);
            return date;
        }
        const startWeek = getStartOfWeek(today);
        let revenue = 0;
        
        // 3. Prepare Chart Data (Last 7 days appointments)
        const data = [];
        for (let i = 0; i < 7; i++) {
            const d = addDays(startWeek, i);
            const count = appts.filter(a => isSameDay(new Date(a.start_time), d)).length;
            data.push({
                name: new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d).replace('.', ''),
                agendamentos: count
            });
        }
        setChartData(data);

        // Calculate total revenue (simulated)
        appts.forEach(a => {
            if(a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.CONFIRMED) {
                const svc = services.find(s => s.id === a.service_id);
                if(svc) revenue += svc.price;
            }
        });

        // 4. Top Service
        const serviceCounts: Record<string, number> = {};
        appts.forEach(a => {
            const sName = services.find(s => s.id === a.service_id)?.name || 'Unknown';
            serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
        });
        const topService = Object.entries(serviceCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

        setStats({
            appointmentsToday: todayAppts.length,
            revenueWeek: revenue,
            occupancyRate: 75, // Mocked for visuals
            topService
        });
    };
    fetchData();
  }, []);

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gold-100 flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
            <h3 className="text-2xl font-serif font-bold text-gold-900 mt-1">{value}</h3>
        </div>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${color}`}>
            <span className="material-symbols-outlined">{icon}</span>
        </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Hoje" value={stats.appointmentsToday} icon="event_available" color="bg-gold-500" />
        <StatCard title="Receita (Est.)" value={`R$ ${stats.revenueWeek}`} icon="payments" color="bg-green-600" />
        <StatCard title="Ocupação" value={`${stats.occupancyRate}%`} icon="pie_chart" color="bg-blue-500" />
        <StatCard title="Top Serviço" value={stats.topService} icon="trophy" color="bg-purple-500" />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gold-100">
        <h3 className="font-serif text-xl font-bold text-gold-900 mb-6">Agendamentos da Semana</h3>
        {/* Use inline style to enforce height immediately, fixing Recharts resize warning */}
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" tick={{fill: '#8E6E3E'}} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        cursor={{fill: '#FCF6BA', opacity: 0.4}}
                    />
                    <Bar dataKey="agendamentos" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === new Date().getDay() ? '#C5A059' : '#E5E7EB'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};