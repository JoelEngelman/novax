import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useGameState } from "./game/useGameState";

import Menu from "./pages/Menu";
import Game from "./pages/Game";
import Finish from "./pages/Finish";
import Garage from "./pages/Garage";

const queryClient = new QueryClient();

function AppContent() {
  // Subscribe only to the screen state. The racing loop updates other store
  // values frequently and must not cause the entire app tree to reconcile.
  const state = useGameState(s => s.state);

  return (
    <>
      {state === 'MENU' && <Menu />}
      {state === 'RACING' && <Game />}
      {state === 'FINISHED' && <Finish />}
      {state === 'GARAGE' && <Garage />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
