interface DirectoryStatsProps {
  totalUsers: number;
  totalLocations: number;
  totalGradYears: number;
}

export function DirectoryStats({ totalUsers, totalLocations, totalGradYears }: DirectoryStatsProps) {
  return (
    <div className="bg-charcoal/5 border border-charcoal/10 p-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <p className="font-serif text-3xl text-charcoal">{totalUsers}</p>
          <p className="font-serif text-sm uppercase tracking-wider text-charcoal/70">Head TAs</p>
        </div>
        <div>
          <p className="font-serif text-3xl text-charcoal">{totalLocations}</p>
          <p className="font-serif text-sm uppercase tracking-wider text-charcoal/70">Locations</p>
        </div>
        <div>
          <p className="font-serif text-3xl text-charcoal">{totalGradYears}</p>
          <p className="font-serif text-sm uppercase tracking-wider text-charcoal/70">Graduation Years</p>
        </div>
      </div>
    </div>
  );
}