import { BookOpen, Calendar, MapPin, Users } from 'lucide-react';

interface ImpactStat {
  id: string;
  value: string;
  label: string;
}

const iconForLabel = (label: string) => {
  if (label.toLowerCase().includes('since')) return <Calendar size={20} />;
  if (label.toLowerCase().includes('branch')) return <MapPin size={20} />;
  if (label.toLowerCase().includes('scripture')) return <BookOpen size={20} />;
  return <Users size={20} />;
};

export default function ChurchImpactStats({ stats }: { stats: ImpactStat[] }) {
  return (
    <div className="home-impact-strip relative border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 grid grid-cols-2 sm:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.id}
            className={`home-impact-stat flex items-center gap-3 sm:gap-4 py-4 sm:py-5 ${index > 1 && index % 2 === 0 ? 'border-t' : ''} ${index > 0 ? 'sm:border-l' : ''}`}
          >
            <span className="home-impact-stat__icon w-10 h-10 rounded-full flex items-center justify-center shrink-0">
              {iconForLabel(stat.label)}
            </span>
            <div>
              <p className="text-xl font-bold leading-none" style={{ color: 'white' }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.78)' }}>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
