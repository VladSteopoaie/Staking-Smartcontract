import React from "react";

function Dashboard({ account }) {
    return (
        account ? (
            <div className="w-100 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                Dashboard
            </div>
        ) : (
            <div className="w-100 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                You must be connected to see this page.
            </div>
        )
    );
}

export default Dashboard;
