import { Metadata } from "next";

export const metadata: Metadata = {
  title: "コース視聴",
  description: "オンラインコースを視聴します",
};

export default function PublicCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-5xl">
        {children}
      </div>
    </div>
  );
}
