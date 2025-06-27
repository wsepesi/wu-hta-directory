import CleanLayout, { CleanPageHeader } from "@/components/layout/CleanLayout";
import { Skeleton } from "@/components/ui/Skeleton";

export default function MissingTAsLoading() {
  return (
    <CleanLayout maxWidth="7xl">
      <CleanPageHeader
        title="Courses Without Recorded HTAs"
        subtitle="View courses lacking Head TA documentation"
        description="Help complete our historical records"
      />

      {/* Statistics */}
      <div className="text-center mb-16">
        <Skeleton variant="text" width="80px" height="60px" className="mx-auto mb-2" />
        <Skeleton variant="text" width="200px" height="16px" className="mx-auto" />
      </div>

      {/* By Semester Section */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">By Semester</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {[1, 2].map((col) => (
            <div key={col} className="border-t border-charcoal pt-6">
              <Skeleton variant="text" width="200px" height="24px" className="mb-6" />
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start justify-between pb-4 border-b border-charcoal/10 last:border-0">
                    <div className="flex-1">
                      <Skeleton variant="text" width="250px" height="20px" className="mb-1" />
                      <Skeleton variant="text" width="200px" height="16px" />
                    </div>
                    <div className="ml-4 flex flex-col space-y-1">
                      <Skeleton variant="text" width="60px" height="16px" />
                      <Skeleton variant="text" width="60px" height="16px" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Courses Missing TAs Section */}
      <section className="mb-16">
        <h2 className="font-serif text-2xl text-charcoal mb-8">All Courses Without Recorded HTAs</h2>
        <div className="bg-white">
          <div className="space-y-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="border-t border-charcoal/20 pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton variant="text" width="300px" height="24px" className="mb-2" />
                    <Skeleton variant="text" width="350px" height="16px" className="mb-1" />
                    <Skeleton variant="text" width="150px" height="16px" />
                  </div>
                  <div className="ml-6 flex flex-col space-y-2">
                    <Skeleton variant="text" width="100px" height="16px" />
                    <Skeleton variant="text" width="100px" height="16px" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Back to dashboard link */}
      <div className="text-center">
        <Skeleton variant="text" width="150px" height="16px" className="mx-auto" />
      </div>
    </CleanLayout>
  );
}