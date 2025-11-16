import { getApplications } from "@/app/actions";
import { AppList } from "@/components/app/AppList";
import { ApplicationData } from "@/lib/definitions";
import { AddAppModal } from "@/components/app/AddAppModal";

function shuffle(array: any[]) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export default async function Home() {
  const result = await getApplications();
  const apps: ApplicationData[] = result.success ? result.data || [] : [];
  const randomApps = shuffle(apps);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Applications</h1>
          <p className="text-muted-foreground">Browse and manage your hosted applications.</p>
        </div>
        <AddAppModal />
      </div>
      <AppList initialApps={randomApps} />
    </div>
  );
}
