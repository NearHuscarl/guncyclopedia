import "./App.css";
import { getGuns } from "./client";

function App() {
  const guns = getGuns();
  return (
    <>
      <pre style={{ textAlign: "left" }}>{JSON.stringify(guns[31], null, 2)}</pre>
    </>
  );
}

export default App;
