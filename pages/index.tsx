import styles from '../styles/Home.module.css';
import { Clue } from '../types';
import { clueData } from '../data/clues';
import { useEffect } from 'react';

const clues: Clue[] = clueData;
const URL = 'http://localhost:3001';

export default function Index() {
  const getData = () => {
    fetch(URL + '/api/suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clues),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  return <div className={styles.container}>hej</div>;
}
