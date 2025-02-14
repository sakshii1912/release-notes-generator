import React from 'react';
import ReleaseNotesForm from '../components/ReleaseNotesForm';
import styles from "../styles/Home.module.css"; // Import new CSS file

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Welcome to AI Release Notes Generator</h2>
      <ReleaseNotesForm />
    </div>
  );
};

export default Home;

