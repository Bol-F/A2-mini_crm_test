import { AppLayout } from "./components/AppLayout";
import { Header } from "./components/Header";
import { LeadsPage } from "./pages/LeadsPage";

export default function App() {
  return (
    <AppLayout header={<Header />}>
      <LeadsPage />
    </AppLayout>
  );
}
