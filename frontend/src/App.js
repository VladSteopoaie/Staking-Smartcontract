import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConnectWallet from "./components/ConnectWallet";
import Stake from "./components/Stake";

function App() {
  const [account, setAccount] = useState(null);

  return (
    <Router>
      <div>
        <h1>Staking DApp</h1>
        <ConnectWallet setAccount={setAccount} />
        {account && <p>Connected as: {account}</p>}
        <Routes>
          <Route path="/" element={<Stake account={ account } amount={ "1" } />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
