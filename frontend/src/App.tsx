import { AppLayout } from "./components/AppLayout";
import { Header } from "./components/Header";
import { LanguageProvider } from "./features/language/LanguageProvider";
import { LeadsPage } from "./pages/LeadsPage";

export default function App() {
  return (
    <LanguageProvider>
      <AppLayout header={<Header />}>
        <LeadsPage />
      </AppLayout>
    </LanguageProvider>
  );
}
