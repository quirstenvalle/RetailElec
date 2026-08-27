import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Welcome to Quinto Store</h1>
      <p>This is the placeholder for our new landing page.</p>
      
      {/* A temporary button to make sure you can still access the system */}
      <Link to="/login" style={{ padding: '10px 20px', background: '#000', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
        Go to Login
      </Link>
    </div>
  );
}