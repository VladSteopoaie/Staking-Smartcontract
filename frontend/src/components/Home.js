import React from "react";
import { useNavigate } from "react-router-dom";

function Home({ account, connectHandler }) {
    const navigate = useNavigate();
    return (
        <div className="w-100 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
            <div className="title-background" data-text="RTOKEN">RTOKEN</div>
            <p className="w-75 description text-center">
                Unlock the full potential of your RTOKEN by staking it on our secure and 
                user-friendly platform. By staking, you actively support the network while 
                earning daily rewards. With competitive rates and a transparent 
                process, staking RTOKEN is the smart way to grow your holdings.
            </p>
            {account ? (
                <button className="btn btn-secondary" onClick={() => { navigate("/dashboard") }}>Go to dashboard</button>
            ) : (
                <button className="btn btn-success" onClick={connectHandler}>Connect to your wallet</button>
            )}
        </div>
    );
}

export default Home;
