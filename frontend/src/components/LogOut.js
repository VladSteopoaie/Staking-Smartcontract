import React from "react";

function LogOut({ setAccount, Text }) {
  const logOut = () => {
    setAccount(null); // Clear the account state to log out
  };

  return (
    <button className="btn btn-danger" onClick={logOut} dangerouslySetInnerHTML={{__html: Text}}>
    </button>
  );
}

export default LogOut;
