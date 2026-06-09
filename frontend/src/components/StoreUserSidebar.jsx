import React, { useState } from 'react';
import '../styles/StoreSidebar.css';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button className="toggle-btn" onClick={toggleSidebar}>
        ☰
      </button>

      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <h2>User Panel</h2>
        <a href="/user-dashboard">Store</a>
        <a href="/user-purchase-summary">Purchase History</a>
      </div>
    </>
  );
};

export default Sidebar;
