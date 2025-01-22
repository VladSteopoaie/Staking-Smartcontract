import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
// import Stake from "./components/Stake";
import Home from "./components/Home";
import Dashboard from "./components/Dashboard";

function App() {
  const [account, setAccount] = useState(null);
  
  function copyToClipboard(textToCopy) {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        alert("Text copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  async function connectWallet(){
    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } else {
      alert("Install Metamask");
    }
  };

  return (
    <Router>
      <div className="container-fluid hero min-vh-100 d-flex flex-column">
        {/* Navbar */}
        <div className="pt-2">
          <nav className="navbar navbar-expand-lg bg-dark navbar-dark shadow m-3 rounded fixed-top" data-bs-theme="dark">
            <div className="container-fluid">
              <Link className="navbar-brand" to="/">
                <i className="bi bi-wallet2 me-2"></i>RToken Staking DApp
              </Link>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarNav"
                aria-controls="navbarNav"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                {account && (
                  <span className="navbar-text text-success">
                    <a role="button" onClick={() => copyToClipboard(account)}>
                      Wallet address: <span className="truncate-text">{account}</span>
                    </a>
                  </span>
                )}
                <ul className="navbar-nav ms-auto">
                  <li className="nav-item">
                    <Link className="nav-link active" aria-current="page" to="/">
                      Home
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link ${account ? "" : "disabled"}`} to="/dashboard  ">
                      Dashboard
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            {account ? ("Connected") : ("Not connected")}
                            <i className={`bi bi-circle-fill mx-1 fs-6 text-${account ? "success" : "danger"}`}></i>
                      </a>
                      <ul className="dropdown-menu">
                        <li>
                          {account ? (
                            <a className="dropdown-item" role="button" onClick={() => {setAccount(null);}}>Log out</a>
                            ) : (
                            <a className="dropdown-item" role="button" onClick={connectWallet}>Log in</a>
                          )}
                        </li>
                      </ul>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content Section */}
        <div className="d-flex flex-grow-1">
          <Routes>
            <Route
              path="/"
              element={
                <Home account={account} connectHandler={connectWallet}/>
              }
            />
            <Route path="/dashboard" element={<Dashboard account={account}/>} />
          </Routes>
        </div>

        {/* Footer */}
        <footer className="text-center py-3 bg-dark m-3 fixed-bottom shadow rounded">
          <p className="text-light mb-0">
            Built with <i className="bi bi-heart-fill text-danger"></i> by the Staking DApp team.
          </p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
