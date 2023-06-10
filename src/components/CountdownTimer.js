import React, { useEffect, useState } from "react";
import DateTimeDisplay from "./DateTimeDisplay";
import styles from "./CountdownTimer.module.css";

const ExpiredNotice = () => {
  return (
    <div className={styles["expired-notice"]}>
      <span>Expired!!!</span>
      <p>Please select a future date and time.</p>
    </div>
  );
};

const ShowCounter = ({ days, hours, minutes, seconds }) => {
  return (
    <div className={styles["show-counter"]}>
      <div className={styles["countdown-link"]}>
        <div className={styles["countdown-item"]}>
          <DateTimeDisplay value={days} type="Days" isDanger={days <= 3} />
        </div>
        <div className={styles["countdown-item"]}>
          <DateTimeDisplay value={hours} type="Hours" isDanger={false} />
        </div>
        <div className={styles["countdown-item"]}>
          <DateTimeDisplay value={minutes} type="Minutes" isDanger={false} />
        </div>
        <div className={styles["countdown-item"]}>
          <DateTimeDisplay value={seconds} type="Seconds" isDanger={false} />
        </div>
      </div>
    </div>
  );
};

const CountdownTimer = ({ startTime, endTime }) => {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime < startTime) {
        // Countdown has not started yet
        const timeDiff = Math.floor((startTime - currentTime) / 1000);
        const d = Math.floor(timeDiff / (60 * 60 * 24));
        const h = Math.floor((timeDiff / (60 * 60)) % 24);
        const m = Math.floor((timeDiff / 60) % 60);
        const s = Math.floor(timeDiff % 60);
        setDays(d);
        setHours(h);
        setMinutes(m);
        setSeconds(s);
      } else if (currentTime < endTime) {
        // Countdown is in progress
        const timeDiff = Math.floor((endTime - currentTime) / 1000);
        const d = Math.floor(timeDiff / (60 * 60 * 24));
        const h = Math.floor((timeDiff / (60 * 60)) % 24);
        const m = Math.floor((timeDiff / 60) % 60);
        const s = Math.floor(timeDiff % 60);
        setDays(d);
        setHours(h);
        setMinutes(m);
        setSeconds(s);
      } else {
        // Countdown has ended
        clearInterval(interval);
        setDays(0);
        setHours(0);
        setMinutes(0);
        setSeconds(0);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [startTime, endTime]);

  if (days + hours + minutes + seconds <= 0) {
    return <ExpiredNotice />;
  } else {
    return (
      <ShowCounter
        days={days}
        hours={hours}
        minutes={minutes}
        seconds={seconds}
      />
    );
  }
};
export default CountdownTimer;
