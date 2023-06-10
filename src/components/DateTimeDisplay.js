import React from "react";
import styles from "./DateTimeDisplay.module.css";

const DateTimeDisplay = ({ value, type, isDanger }) => {
  const countdownClassName = isDanger
    ? `${styles.countdown} ${styles.danger}`
    : styles.countdown;

  return (
    <div className={countdownClassName}>
      <p className={styles.number}>{value}</p>
      <span className={styles.label}>{type}</span>
    </div>
  );
};

export default DateTimeDisplay;
