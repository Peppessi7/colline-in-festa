import { Switch, Route, Router as WouterRouter } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import NotFound from "@/pages/not-found";

import Layout from "@/components/layout";
import PlannerPage from "@/pages/home";
import MenuPage from "@/pages/menu";
import MappaPage from "@/pages/mappa";

function Router() {
  return (
    <Switch>
      <Route path="/" component={PlannerPage} />
      <Route path="/menu" component={MenuPage} />
      <Route path="/mappa" component={MappaPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Layout>
        <Router />
      </Layout>
    </WouterRouter>
  );
}

export default App;
