import { useState } from "react";
import { Form, Button, Row, Col, Spinner } from "react-bootstrap";

import { ethers } from "ethers";

const Buy = ({ provider, price, crowdsale, setIsLoading }) => {
  const [amount, setAmount] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);

  const buyHandler = async e => {
    e.preventDefault();
    setIsWaiting(true);

    try {
      const signer = await provider.getSigner();

      const value = ethers.utils.parseUnits(
        (amount * price).toString(),
        "ether"
      );
      const formattedAmount = ethers.utils.parseUnits(
        amount.toString(),
        "ether"
      );

      const transaction = await crowdsale
        .connect(signer)
        .buyTokens(formattedAmount, { value: value });

      await transaction.wait();
    } catch (err) {
      window.alert("User rejected transaction or transaction reverted");
    }

    setIsLoading(true);
  };

  return (
    <Form
      onSubmit={buyHandler}
      style={{ maxWidth: "800px", margin: "50px auto" }}
    >
      <Form.Group as={Row}>
        <Col>
          <Form.Control
            type="number"
            placeholder="Enter Amount"
            min={100}
            max={10000}
            onChange={e => setAmount(e.target.value)}
          />
          <p className="my-3">Min Purchase: 100 Max Purchase: 10000</p>
        </Col>
        <Col className="text-center">
          {isWaiting ? (
            <Spinner animation="border" variant="primary" />
          ) : (
            <Button variant="primary" type="submit" style={{ width: "100%" }}>
              Buy Tokens
            </Button>
          )}
        </Col>
      </Form.Group>
    </Form>
  );
};

export default Buy;
