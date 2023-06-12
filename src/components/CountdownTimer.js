import React, { useEffect, useState } from "react";
import DateTimeDisplay from "./DateTimeDisplay";
import styles from "./CountdownTimer.module.css";
import { Button } from "react-bootstrap";
import { ethers } from "ethers";

const SuccessNotice = () => {
  return (
    <div className={styles["success-notice"]}>
      <span>Campaign Successful!</span>
      <p>Thank you for your support.</p>
    </div>
  );
};

const ExpiredNotice = ({ handleRefund }) => {
  return (
    <div className={styles["expired-notice"]}>
      <span>Expired!</span>
      <p>
        The campaign has ended without reaching the target
        <br /> Click on the refund to claim your ETH
      </p>
      <Button variant="primary" onClick={handleRefund}>
        Refund
      </Button>
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

const CountdownTimer = ({
  startTime,
  endTime,
  crowdsale,
  provider,
  tokensSold,
  maxTokens,
  token,
  price,
}) => {
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const handleRefund = async () => {
    if (!provider || !crowdsale) return;
    let transaction;

    try {
      const signer = await provider.getSigner();
      const totalAmount = await token.balanceOf(signer.getAddress());
      const contractBalanceWei = await provider.getBalance(crowdsale.address);
      const contractBalanceEth = ethers.utils.formatEther(contractBalanceWei);
      console.log("contractBalance", contractBalanceEth);

      const tokenWithSigner = token.connect(signer);
      transaction = await tokenWithSigner.approve(
        crowdsale.address,
        totalAmount
      );
      await transaction.wait();

      const value = ethers.utils.parseUnits(
        (totalAmount * price).toString(),
        "ether"
      );

      transaction = await crowdsale.connect(signer).refundCampaign();
      await transaction.wait();
    } catch (error) {
      window.alert(
        "There was an error while refunding, please try again later"
      );
    }
  };

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

  const targetReached = tokensSold >= maxTokens * 0.8;

  if (days + hours + minutes + seconds <= 0) {
    // Countdown has reached zero
    if (targetReached) {
      return <SuccessNotice />;
    } else {
      return <ExpiredNotice handleRefund={handleRefund} />;
    }
  }
  return (
    <ShowCounter
      days={days}
      hours={hours}
      minutes={minutes}
      seconds={seconds}
    />
  );
};

export default CountdownTimer;
